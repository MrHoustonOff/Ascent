// Package app — методы, доступные фронтенду. Не зависит от Wails: окно, буфер
// обмена и диалоги приходят через интерфейс Host.
package app

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"ascent/internal/plan"
	"ascent/internal/stats"
	"ascent/internal/store"
)

// Host — то, что умеет только оболочка (Wails или dev-сервер).
type Host interface {
	ClipboardSet(text string) error
	OpenURL(url string)
	PickDir(title string) (string, error)
}

type App struct {
	mu       sync.Mutex
	st       *store.Store
	plan     *plan.Plan
	planFS   fs.FS
	host     Host
	Now      func() time.Time
	Loc      *time.Location
	Dev      bool
	dir      string
	log      func(string, ...any)
	lastSync store.SyncReport
}

// New открывает базу в dataDir и синхронизирует план.
func New(dataDir string, host Host, now func() time.Time, loc *time.Location) (*App, error) {
	if now == nil {
		now = time.Now
	}
	if loc == nil {
		loc = time.Local
	}
	s, err := store.Open(filepath.Join(dataDir, "ascent.db"))
	if err != nil {
		return nil, err
	}
	s.Now = now
	a := &App{st: s, host: host, Now: now, Loc: loc, dir: dataDir, log: func(string, ...any) {}}
	a.log = func(f string, args ...any) {}
	if err := a.loadPlan(); err != nil {
		return nil, err
	}
	if _, err := s.DailyBackup(); err != nil {
		a.log("backup: %v", err)
	}
	return a, nil
}

// SetLogger и Shutdown — функции пакета, а не методы: методы App целиком уходят во фронтенд.
func SetLogger(a *App, f func(string, ...any)) { a.log = f }

func Shutdown(a *App) error { return a.st.Close() }

func (a *App) loadPlan() error {
	set, err := a.st.Settings()
	if err != nil {
		return err
	}
	var p *plan.Plan
	var fsys fs.FS
	if src := set["plan_source"]; src != "" && src != "embedded" {
		if _, e := os.Stat(src); e == nil {
			fsys = os.DirFS(src)
			p, err = plan.Parse(fsys)
			if err != nil {
				p = nil
			}
		}
	}
	if p == nil {
		fsys = plan.Embedded()
		p, err = plan.Parse(fsys)
		if err != nil {
			return err
		}
	}
	a.plan, a.planFS = p, fsys
	rep, err := a.st.Sync(p)
	if err != nil {
		return err
	}
	_ = a.st.SetSetting("plan_version", p.Version)
	_ = a.st.SetSetting("plan_synced_at", a.Now().UTC().Format(time.RFC3339))
	a.lastSync = rep
	if sn, err := a.snap(); err == nil {
		a.syncAch(sn)
	}
	return nil
}

// ---------- снимок состояния ----------

type snap struct {
	a     *App
	in    *stats.Input
	set   map[string]string
	now   time.Time
	today time.Time
}

func atoi(s string, def int) int {
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func (a *App) snap() (*snap, error) {
	set, err := a.st.Settings()
	if err != nil {
		return nil, err
	}
	ls, err := a.st.Lessons()
	if err != nil {
		return nil, err
	}
	ck, err := a.st.Checks()
	if err != nil {
		return nil, err
	}
	mk, err := a.st.Markers()
	if err != nil {
		return nil, err
	}
	rest, err := a.st.RestDays()
	if err != nil {
		return nil, err
	}
	now := a.Now()
	in := &stats.Input{
		Plan: a.plan, Lessons: ls, Checks: ck, Markers: mk, Rest: rest, Now: now, Loc: a.Loc,
		S: stats.Settings{
			DayStartHour:   atoi(set["day_start_hour"], 4),
			RestPerWeek:    atoi(set["rest_per_week"], 1),
			ProjectDays:    atoi(set["project_days"], 4),
			MilestoneStage: atoi(set["milestone_stage"], 3),
			MilestoneDate:  set["milestone_target"],
		},
	}
	return &snap{a: a, in: in, set: set, now: now, today: in.Today()}, nil
}

func (s *snap) status(id string) string { return s.in.Lessons[id].Status }

// themeState — состояние темы для дерева (8.3).
func (s *snap) themeState(th *plan.Theme) string {
	if s.in.ThemeClosed(th) {
		return "done"
	}
	for _, l := range th.Lessons {
		if st := s.status(l.ID); st == "done" || st == "doing" {
			return "doing"
		}
	}
	return "todo"
}

func (s *snap) blockState(b *plan.Block) string {
	if s.in.BlockClosed(b) {
		return "done"
	}
	if b.Run != nil && len(b.Themes) == 0 {
		if s.status(b.Run.ID) == "doing" {
			return "doing"
		}
		return "todo"
	}
	for _, th := range b.Themes {
		if s.themeState(th) != "todo" {
			return "doing"
		}
	}
	return "todo"
}

func (s *snap) stageState(st *plan.Stage) string {
	if s.in.StageClosed(st) {
		return "done"
	}
	for _, b := range st.Blocks {
		if s.blockState(b) != "todo" {
			return "doing"
		}
	}
	return "todo"
}

func (s *snap) themeCounts(th *plan.Theme) (done, total int) {
	for _, l := range th.Lessons {
		total++
		if s.status(l.ID) == "done" {
			done++
		}
	}
	return
}

func (s *snap) blockCounts(b *plan.Block) (done, total int) {
	for _, th := range b.Themes {
		d, t := s.themeCounts(th)
		done += d
		total += t
	}
	if b.Run != nil {
		total++
		if s.status(b.Run.ID) == "done" {
			done++
		}
	}
	return
}

func (s *snap) stageCounts(st *plan.Stage) (done, total int) {
	for _, b := range st.Blocks {
		d, t := s.blockCounts(b)
		done += d
		total += t
	}
	return
}

func (s *snap) totalCounts() (done, total int) {
	for _, id := range s.a.plan.Order {
		total++
		if s.status(id) == "done" {
			done++
		}
	}
	return
}

func pct(d, t int) int {
	if t == 0 {
		return 0
	}
	return d * 100 / t
}

// themesToday — темы, закрытые в текущий учебный день.
func (s *snap) themesToday() int {
	if a := s.in.Aggregates()[s.today.Format("2006-01-02")]; a != nil {
		return a.Themes
	}
	return 0
}

var _ = fmt.Sprintf
