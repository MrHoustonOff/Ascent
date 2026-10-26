package app

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode"

	"ascent/internal/plan"
	"ascent/internal/stats"
	"ascent/internal/store"
)

// ---------- DTO ----------

type ArrowDTO struct {
	Kind string   `json:"kind"`
	Text string   `json:"text"`
	IDs  []string `json:"ids"`
}

type LessonDTO struct {
	ID     string     `json:"id"`
	Title  string     `json:"title"`
	Stars  int        `json:"stars"`
	Kind   string     `json:"kind"`
	Status string     `json:"status"`
	Note   string     `json:"note"`
	DoneAt string     `json:"doneAt"`
	Arrows []ArrowDTO `json:"arrows"`
	Theme  string     `json:"theme"`
	Block  string     `json:"block"`
	Stage  int        `json:"stage"`
}

type CheckDTO struct {
	DoneAt string `json:"doneAt"`
	N      int    `json:"n"`
	Text   string `json:"text"`
	Done   bool   `json:"done"`
}

type SourceDTO struct {
	Key   string `json:"key"`
	Title string `json:"title"`
	URL   string `json:"url"`
	Kind  string `json:"kind"` // src | typical | trap
}

type MarkerDTO struct {
	N       int         `json:"n"`
	Block   string      `json:"block"`
	Text    string      `json:"text"`
	Done    bool        `json:"done"`
	DoneAt  string      `json:"doneAt"`
	Lessons []LessonRef `json:"lessons"`
	Sources []SourceDTO `json:"sources"`
}

type LessonRef struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Status string `json:"status"`
}

type NodeDTO struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	State string `json:"state"`
	Done  int    `json:"done"`
	Total int    `json:"total"`
	Pct   int    `json:"pct"`
	// проверка темы: уроки пройдены, вопросы нет
	CheckPending bool   `json:"checkPending,omitempty"`
	ClosedAt     string `json:"closedAt,omitempty"`
}

type TreeBlock struct {
	NodeDTO
	Themes []NodeDTO `json:"themes"`
	IsRun  bool      `json:"isRun"`
}

type TreeStage struct {
	NodeDTO
	Num    int         `json:"num"`
	Blocks []TreeBlock `json:"blocks"`
}

type TreeDTO struct {
	Stages       []TreeStage `json:"stages"`
	Pct          int         `json:"pct"`
	Done         int         `json:"done"`
	Total        int         `json:"total"`
	CurStage     int         `json:"curStage"`
	CurBlock     string      `json:"curBlock"`
	CurTheme     string      `json:"curTheme"`
	CurLesson    string      `json:"curLesson"`
	CurStageName string      `json:"curStageName"`
	AchUnlocked  int         `json:"achUnlocked"`
	AchTotal     int         `json:"achTotal"`
	AchNew       int         `json:"achNew"`
}

type ThemeDTO struct {
	ID          string      `json:"id"`
	Title       string      `json:"title"`
	Brief       []string    `json:"brief"`
	Block       string      `json:"block"`
	BlockTitle  string      `json:"blockTitle"`
	Stage       int         `json:"stage"`
	StageTitle  string      `json:"stageTitle"`
	State       string      `json:"state"`
	Lessons     []LessonDTO `json:"lessons"`
	Checks      []CheckDTO  `json:"checks"`
	Done        int         `json:"done"`
	Total       int         `json:"total"`
	ChecksDone  int         `json:"checksDone"`
	Closed      bool        `json:"closed"`
	ClosedAt    string      `json:"closedAt"`
	CurLesson   string      `json:"curLesson"`
	PrevTheme   string      `json:"prevTheme"`
	NextTheme   string      `json:"nextTheme"`
	NextThemeTi string      `json:"nextThemeTitle"`
}

type DepDTO struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	State string `json:"state"`
}

type BlockDTO struct {
	ID         string      `json:"id"`
	Title      string      `json:"title"`
	Why        string      `json:"why"`
	Stage      int         `json:"stage"`
	StageTitle string      `json:"stageTitle"`
	State      string      `json:"state"`
	Deps       []DepDTO    `json:"deps"`
	Themes     []NodeDTO   `json:"themes"`
	Markers    []MarkerDTO `json:"markers"`
	Run        *LessonDTO  `json:"run"`
	ClosedAt   string      `json:"closedAt"`
	Done       int         `json:"done"`
	Total      int         `json:"total"`
	Pct        int         `json:"pct"`
}

type StageDTO struct {
	Num      int        `json:"num"`
	Title    string     `json:"title"`
	Intro    []string   `json:"intro"`
	Order    string     `json:"order"`
	Blocks   []NodeDTO  `json:"blocks"`
	Run      *LessonDTO `json:"run"`
	ClosedAt string     `json:"closedAt"`
	State    string     `json:"state"`
	Done     int        `json:"done"`
	Total    int        `json:"total"`
	Pct      int        `json:"pct"`
}

type SearchHit struct {
	Kind  string `json:"kind"` // lesson | theme | block | term
	ID    string `json:"id"`
	Title string `json:"title"`
	Sub   string `json:"sub"`
}

// ---------- сборка ----------

func (s *snap) lessonDTO(l *plan.Lesson) LessonDTO {
	r := s.in.Lessons[l.ID]
	d := LessonDTO{ID: l.ID, Title: l.Title, Stars: l.Stars, Kind: l.Kind, Status: r.Status, Note: r.Note,
		Theme: l.Theme, Block: l.Block, Stage: l.Stage, Arrows: []ArrowDTO{}}
	if d.Status == "" {
		d.Status = "todo"
	}
	d.DoneAt = s.doneLabel(r)
	for _, a := range l.Arrows {
		ids := a.IDs
		if ids == nil {
			ids = []string{}
		}
		d.Arrows = append(d.Arrows, ArrowDTO{Kind: a.Kind, Text: a.Text, IDs: ids})
	}
	return d
}

func (s *snap) lessonRef(id string) LessonRef {
	l := s.a.plan.Lessons[id]
	if l == nil {
		return LessonRef{ID: id}
	}
	return LessonRef{ID: id, Title: l.Title, Status: s.status(id)}
}

func (s *snap) markerDTOs(b *plan.Block) []MarkerDTO {
	var out []MarkerDTO
	for i, q := range s.a.plan.Markers(b.ID) {
		out = append(out, s.markerDTO(i+1, q))
	}
	if out == nil {
		out = []MarkerDTO{}
	}
	return out
}

func (s *snap) markerDTO(n int, q *plan.BankQ) MarkerDTO {
	mt, done := s.in.Markers[stats.MarkerKey(q.Block, q)]
	m := MarkerDTO{N: n, Block: q.Block, Text: q.Text, Done: done, Lessons: []LessonRef{}, Sources: s.sourceDTOs(q)}
	if done {
		m.DoneAt = s.dayText(mt)
	}
	for _, id := range q.Lessons {
		m.Lessons = append(m.Lessons, s.lessonRef(id))
	}
	return m
}

func (s *snap) sourceDTOs(q *plan.BankQ) []SourceDTO {
	out := []SourceDTO{}
	for _, k := range q.Sources {
		src := s.a.plan.Sources[k]
		d := SourceDTO{Key: strings.Trim(k, "[]"), Title: src.Title, URL: src.URL, Kind: "src"}
		switch k {
		case "[—]":
			d.Kind = "typical"
		case "[Л]":
			d.Kind = "trap"
		}
		out = append(out, d)
	}
	return out
}

func (s *snap) themeNode(th *plan.Theme) NodeDTO {
	d, t := s.themeCounts(th)
	return NodeDTO{ID: th.ID, Title: th.Title, State: s.themeState(th), Done: d, Total: t, Pct: pct(d, t),
		CheckPending: s.in.LessonsDone(th) && !s.in.ThemeClosed(th), ClosedAt: s.themeClosedText(th)}
}

func (s *snap) blockNode(b *plan.Block) NodeDTO {
	d, t := s.blockCounts(b)
	return NodeDTO{ID: b.ID, Title: b.Title, State: s.blockState(b), Done: d, Total: t, Pct: pct(d, t), ClosedAt: s.blockClosedText(b)}
}

func (a *App) stageByNum(n int) *plan.Stage {
	for _, s := range a.plan.Stages {
		if s.Num == n {
			return s
		}
	}
	return nil
}

// ---------- методы ----------

func (a *App) Tree() (TreeDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return TreeDTO{}, err
	}
	t := TreeDTO{Stages: []TreeStage{}}
	t.Done, t.Total = s.totalCounts()
	t.Pct = pct(t.Done, t.Total)
	for _, st := range a.plan.Stages {
		d, tt := s.stageCounts(st)
		ts := TreeStage{NodeDTO: NodeDTO{ID: "stage-" + strconv.Itoa(st.Num), Title: st.Title, State: s.stageState(st), Done: d, Total: tt, Pct: pct(d, tt), ClosedAt: s.stageClosedText(st)}, Num: st.Num, Blocks: []TreeBlock{}}
		for _, b := range st.Blocks {
			tb := TreeBlock{NodeDTO: s.blockNode(b), Themes: []NodeDTO{}, IsRun: b.Run != nil && len(b.Themes) == 0}
			for _, th := range b.Themes {
				tb.Themes = append(tb.Themes, s.themeNode(th))
			}
			ts.Blocks = append(ts.Blocks, tb)
		}
		t.Stages = append(t.Stages, ts)
	}
	if n := s.in.NextLesson(); n != nil {
		t.CurStage, t.CurBlock, t.CurTheme, t.CurLesson = n.Stage, n.Block, n.Theme, n.ID
		if st := a.stageByNum(n.Stage); st != nil {
			t.CurStageName = st.Title
		}
	}
	t.AchUnlocked, t.AchTotal = a.achCounts()
	if m, err := a.st.Achievements(); err == nil {
		for _, r := range m {
			if !r.Seen {
				t.AchNew++
			}
		}
	}
	return t, nil
}

func (a *App) Theme(id string) (ThemeDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return ThemeDTO{}, err
	}
	th := a.plan.Themes[id]
	if th == nil {
		return ThemeDTO{}, errNotFound(id)
	}
	b := a.plan.Blocks[th.Block]
	d := ThemeDTO{ID: th.ID, Title: th.Title, Brief: th.Brief, Block: b.ID, BlockTitle: b.Title, Stage: th.Stage,
		State: s.themeState(th), Lessons: []LessonDTO{}, Checks: []CheckDTO{}}
	if d.Brief == nil {
		d.Brief = []string{}
	}
	if st := a.stageByNum(th.Stage); st != nil {
		d.StageTitle = st.Title
	}
	d.Done, d.Total = s.themeCounts(th)
	d.Closed = s.in.ThemeClosed(th)
	d.ClosedAt = s.themeClosedText(th)
	if n := s.in.NextLesson(); n != nil {
		d.CurLesson = n.ID
	}
	for _, l := range th.Lessons {
		d.Lessons = append(d.Lessons, s.lessonDTO(l))
	}
	for i, c := range th.Checks {
		_, ok := s.in.Checks[store.CheckKey(th.ID, c)]
		if ok {
			d.ChecksDone++
		}
		at := ""
		if t, has := s.in.Checks[store.CheckKey(th.ID, c)]; has {
			at = s.dayText(t)
		}
		d.Checks = append(d.Checks, CheckDTO{N: i + 1, Text: c, Done: ok, DoneAt: at})
	}
	// соседние темы в порядке плана
	var all []*plan.Theme
	for _, st := range a.plan.Stages {
		for _, bl := range st.Blocks {
			all = append(all, bl.Themes...)
		}
	}
	for i, x := range all {
		if x.ID == id {
			if i > 0 {
				d.PrevTheme = all[i-1].ID
			}
			if i+1 < len(all) {
				d.NextTheme, d.NextThemeTi = all[i+1].ID, all[i+1].Title
			}
		}
	}
	return d, nil
}

type notFound string

func (e notFound) Error() string  { return "не найдено: " + string(e) }
func errNotFound(id string) error { return notFound(id) }

func (a *App) Block(id string) (BlockDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return BlockDTO{}, err
	}
	b := a.plan.Blocks[id]
	if b == nil {
		return BlockDTO{}, errNotFound(id)
	}
	d := BlockDTO{ID: b.ID, Title: b.Title, Why: b.Why, Stage: b.Stage, State: s.blockState(b), Deps: []DepDTO{}, Themes: []NodeDTO{}}
	if st := a.stageByNum(b.Stage); st != nil {
		d.StageTitle = st.Title
	}
	d.Done, d.Total = s.blockCounts(b)
	d.Pct = pct(d.Done, d.Total)
	d.ClosedAt = s.blockClosedText(b)
	for _, dep := range b.Deps {
		if db := a.plan.Blocks[dep]; db != nil {
			d.Deps = append(d.Deps, DepDTO{ID: dep, Title: db.Title, State: s.blockState(db)})
		}
	}
	for _, th := range b.Themes {
		d.Themes = append(d.Themes, s.themeNode(th))
	}
	d.Markers = s.markerDTOs(b)
	if b.Run != nil {
		r := s.lessonDTO(b.Run)
		d.Run = &r
	}
	return d, nil
}

func (a *App) Stage(num int) (StageDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return StageDTO{}, err
	}
	st := a.stageByNum(num)
	if st == nil {
		return StageDTO{}, errNotFound("этап")
	}
	d := StageDTO{Num: st.Num, Title: st.Title, Intro: st.Intro, State: s.stageState(st), Blocks: []NodeDTO{}}
	if d.Intro == nil {
		d.Intro = []string{}
	}
	d.Done, d.Total = s.stageCounts(st)
	d.Pct = pct(d.Done, d.Total)
	d.ClosedAt = s.stageClosedText(st)
	var order []string
	for _, b := range st.Blocks {
		order = append(order, b.ID)
		d.Blocks = append(d.Blocks, s.blockNode(b))
		if b.Run != nil {
			r := s.lessonDTO(b.Run)
			d.Run = &r
		}
	}
	d.Order = strings.Join(order, " → ")
	return d, nil
}

// ---------- поиск ----------

func norm(s string) string { return strings.ToLower(strings.ReplaceAll(s, "ё", "е")) }

func (a *App) Search(q string) ([]SearchHit, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	q = strings.TrimSpace(q)
	out := []SearchHit{}
	if q == "" {
		return out, nil
	}
	nq := norm(q)
	toks := strings.FieldsFunc(nq, unicode.IsSpace)
	type scored struct {
		h SearchHit
		s int
	}
	var res []scored
	match := func(id, title string) int {
		nid, nt := norm(id), norm(title)
		switch {
		case nid == nq:
			return 100
		case strings.HasPrefix(nid, nq):
			return 80
		case strings.Contains(nid, nq):
			return 60
		}
		for _, t := range toks {
			if !strings.Contains(nt, t) && !strings.Contains(nid, t) {
				return 0
			}
		}
		if len(toks) > 0 {
			return 40
		}
		return 0
	}
	for _, st := range a.plan.Stages {
		for _, b := range st.Blocks {
			if sc := match(b.ID, b.Title); sc > 0 {
				res = append(res, scored{SearchHit{"block", b.ID, b.Title, "Блок"}, sc + 3})
			}
			for _, th := range b.Themes {
				if sc := match(th.ID, th.Title); sc > 0 {
					res = append(res, scored{SearchHit{"theme", th.ID, th.Title, "Тема · " + b.ID}, sc + 2})
				}
			}
		}
	}
	for _, id := range a.plan.Order {
		l := a.plan.Lessons[id]
		if sc := match(l.ID, l.Title); sc > 0 {
			sub := "Урок"
			if l.Theme != "" {
				sub = "Урок · " + l.Theme
			}
			res = append(res, scored{SearchHit{"lesson", l.ID, l.Title, sub}, sc})
		}
	}
	for _, t := range a.plan.Terms {
		if strings.Contains(norm(t.Name), nq) {
			sub := "Термин · " + t.Ref
			res = append(res, scored{SearchHit{"term", t.Ref, t.Name, sub}, 30})
		}
	}
	sort.SliceStable(res, func(i, j int) bool { return res[i].s > res[j].s })
	for i, r := range res {
		if i >= 40 {
			break
		}
		out = append(out, r.h)
	}
	return out, nil
}

// ---------- даты закрытия ----------

// dayText — «24 октября» (с годом, если он не текущий).
func (s *snap) dayText(t time.Time) string {
	d := stats.ParseDay(s.in.DayLabel(t))
	if d.Year() != s.today.Year() {
		return fmt.Sprintf("%s %d", dateGen(d), d.Year())
	}
	return dateGen(d)
}

func (s *snap) doneLabel(r store.Lesson) string {
	if r.Status != "done" {
		return ""
	}
	if r.Imported || !r.HasDone() {
		return "пройдено ранее"
	}
	return s.dayText(r.DoneAt)
}

func (s *snap) themeClosedText(th *plan.Theme) string {
	if !s.in.ThemeClosed(th) {
		return ""
	}
	if t, ok := s.in.ThemeClosedAt(th); ok {
		return s.dayText(t)
	}
	return "ранее"
}

func (s *snap) blockClosedText(b *plan.Block) string {
	t, ok := s.in.BlockClosedAt(b)
	if !ok {
		return ""
	}
	if t.IsZero() {
		return "ранее"
	}
	return s.dayText(t)
}

func (s *snap) stageClosedText(st *plan.Stage) string {
	t, ok := s.in.StageClosedAt(st)
	if !ok {
		return ""
	}
	if t.IsZero() {
		return "ранее"
	}
	return s.dayText(t)
}
