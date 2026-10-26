package app

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"ascent/internal/plan"
	"ascent/internal/stats"
	"ascent/internal/store"
)

// ---------- банк вопросов ----------

type BankFilter struct {
	Stage      int    `json:"stage"`
	Block      string `json:"block"`
	Markers    bool   `json:"markers"`
	Unchecked  bool   `json:"unchecked"`
	Q          string `json:"q"`
	Random     int    `json:"random"` // N случайных маркеров
	RandomSeed int64  `json:"seed"`
}

type BankQDTO struct {
	Key     string      `json:"key"`
	Block   string      `json:"block"`
	BlockTi string      `json:"blockTitle"`
	Stage   int         `json:"stage"`
	Text    string      `json:"text"`
	Marker  bool        `json:"marker"`
	N       int         `json:"n"` // номер среди маркеров блока (для SetMarker)
	Done    bool        `json:"done"`
	Lessons []LessonRef `json:"lessons"`
	Sources []SourceDTO `json:"sources"`
}

type BankDTO struct {
	Items   []BankQDTO  `json:"items"`
	Total   int         `json:"total"`
	Markers int         `json:"markers"`
	Sources []SourceDTO `json:"sources"`
	Blocks  []NodeDTO   `json:"blocks"`
}

func (a *App) Bank(f BankFilter) (BankDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return BankDTO{}, err
	}
	out := BankDTO{Items: []BankQDTO{}, Sources: []SourceDTO{}, Blocks: []NodeDTO{}}
	nq := norm(strings.TrimSpace(f.Q))
	mnum := map[*plan.BankQ]int{}
	cnt := map[string]int{}
	for _, q := range a.plan.Bank {
		if q.Marker {
			cnt[q.Block]++
			mnum[q] = cnt[q.Block]
		}
	}
	for _, q := range a.plan.Bank {
		out.Total++
		if q.Marker {
			out.Markers++
		}
		if f.Stage > 0 && q.Stage != f.Stage {
			continue
		}
		if f.Block != "" && q.Block != f.Block {
			continue
		}
		if (f.Markers || f.Random > 0) && !q.Marker {
			continue
		}
		_, done := s.in.Markers[stats.MarkerKey(q.Block, q)]
		if f.Unchecked && q.Marker && done {
			continue
		}
		if f.Unchecked && !q.Marker {
			// у обычных вопросов нет отметки: фильтр на них не действует
		}
		if nq != "" && !strings.Contains(norm(q.Text), nq) {
			continue
		}
		d := BankQDTO{Key: bankKey(q), Block: q.Block, Stage: q.Stage, Text: q.Text, Marker: q.Marker, N: mnum[q], Done: done,
			Lessons: []LessonRef{}, Sources: s.sourceDTOs(q)}
		if b := a.plan.Blocks[q.Block]; b != nil {
			d.BlockTi = b.Title
		}
		for _, id := range q.Lessons {
			d.Lessons = append(d.Lessons, s.lessonRef(id))
		}
		out.Items = append(out.Items, d)
	}
	if f.Random > 0 && len(out.Items) > f.Random {
		seed := f.RandomSeed
		if seed == 0 {
			seed = a.Now().UnixNano()
		}
		// простая детерминированная перестановка
		x := uint64(seed)
		for i := len(out.Items) - 1; i > 0; i-- {
			x = x*6364136223846793005 + 1442695040888963407
			j := int((x >> 33) % uint64(i+1))
			out.Items[i], out.Items[j] = out.Items[j], out.Items[i]
		}
		out.Items = out.Items[:f.Random]
		sort.SliceStable(out.Items, func(i, j int) bool { return false })
	}
	// справочник источников — в порядке файла по ключу
	keys := make([]string, 0, len(a.plan.Sources))
	for k := range a.plan.Sources {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		src := a.plan.Sources[k]
		if src.URL == "" {
			continue
		}
		out.Sources = append(out.Sources, SourceDTO{Key: strings.Trim(k, "[]"), Title: src.Title, URL: src.URL, Kind: "src"})
	}
	seen := map[string]bool{}
	for _, q := range a.plan.Bank {
		if !seen[q.Block] {
			seen[q.Block] = true
			if b := a.plan.Blocks[q.Block]; b != nil {
				out.Blocks = append(out.Blocks, NodeDTO{ID: b.ID, Title: b.Title, Done: b.Stage})
			}
		}
	}
	return out, nil
}

// ---------- словарь ----------

type TermDTO struct {
	Name        string `json:"name"`
	Ref         string `json:"ref"`
	RefID       string `json:"refId"`
	LessonTitle string `json:"lessonTitle"`
	LessonDone  bool   `json:"lessonDone"`
	Block       string `json:"block"`
	BlockTi     string `json:"blockTitle"`
	Stage       int    `json:"stage"`
	Pattern     string `json:"pattern"`
}

func (a *App) Glossary(q string) ([]TermDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return nil, err
	}
	nq := norm(strings.TrimSpace(q))
	out := []TermDTO{}
	for _, t := range a.plan.Terms {
		if nq != "" && !strings.Contains(norm(t.Name), nq) {
			continue
		}
		d := TermDTO{Name: t.Name, Ref: t.Ref, Block: t.Block, Stage: t.Stage, Pattern: t.Pattern}
		if id := reIDText.FindString(t.Ref); id != "" && a.plan.Lessons[id] != nil {
			d.RefID = id
			d.LessonTitle = a.plan.Lessons[id].Title
			d.LessonDone = s.status(id) == "done"
		}
		if b := a.plan.Blocks[t.Block]; b != nil {
			d.BlockTi = b.Title
		}
		out = append(out, d)
	}
	return out, nil
}

// ---------- настройки ----------

func (a *App) Settings() (map[string]string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.st.Settings()
}

var intRanges = map[string][2]int{
	"day_start_hour": {0, 8}, "rest_per_week": {0, 2}, "project_days": {1, 14}, "milestone_stage": {1, 7}, "ui_zoom": {70, 175},
}

func (a *App) SetSetting(key, value string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if _, ok := store.Defaults[key]; !ok && !strings.HasPrefix(key, "win_") {
		return fmt.Errorf("неизвестная настройка: %s", key)
	}
	if r, ok := intRanges[key]; ok {
		n := atoi(value, -1)
		if n < r[0] || n > r[1] {
			return fmt.Errorf("значение вне диапазона %d–%d", r[0], r[1])
		}
	}
	if key == "zoom_gopher" && value != "0" && value != "1" {
		return fmt.Errorf("значение 0 или 1")
	}
	if key == "theme" && value != "light" && value != "dark" && value != "system" {
		return fmt.Errorf("неизвестная тема")
	}
	if key == "target_scope" && value != "milestone" && value != "path" {
		return fmt.Errorf("неизвестная цель даты")
	}
	if key == "milestone_target" && value != "" {
		if _, err := time.Parse("2006-01-02", value); err != nil {
			return fmt.Errorf("дата в формате ГГГГ-ММ-ДД")
		}
	}
	return a.st.SetSetting(key, value)
}

type PlanInfo struct {
	Version  string           `json:"version"`
	Source   string           `json:"source"`
	SyncedAt string           `json:"syncedAt"`
	Lessons  int              `json:"lessons"`
	Themes   int              `json:"themes"`
	Blocks   int              `json:"blocks"`
	Stages   int              `json:"stages"`
	Last     store.SyncReport `json:"lastSync"`
	Orphans  []OrphanDTO      `json:"orphans"`
	DataDir  string           `json:"dataDir"`
	Demo     bool             `json:"demo"`
}

type OrphanDTO struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Status string `json:"status"`
}

func (a *App) PlanInfo() (PlanInfo, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	set, err := a.st.Settings()
	if err != nil {
		return PlanInfo{}, err
	}
	info := PlanInfo{Version: a.plan.Version, Source: set["plan_source"], Lessons: len(a.plan.Order), Themes: len(a.plan.Themes),
		Blocks: len(a.plan.Blocks), Stages: len(a.plan.Stages), Last: a.lastSync, DataDir: a.dir, Demo: demoAvailable, Orphans: []OrphanDTO{}}
	if t, err := time.Parse(time.RFC3339, set["plan_synced_at"]); err == nil {
		info.SyncedAt = fmt.Sprintf("%s, %s", dateGen(t.In(a.Loc)), t.In(a.Loc).Format("15:04"))
	}
	os_, _ := a.st.Orphans()
	for _, o := range os_ {
		info.Orphans = append(info.Orphans, OrphanDTO{o.ID, o.Title, o.Status})
	}
	return info, nil
}

func (a *App) AdoptOrphan(orphan, target string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.plan.Lessons[target] == nil {
		return errNotFound(target)
	}
	return a.st.AdoptOrphan(orphan, target)
}

// ReloadPlanFromDir: выбрать папку диалогом и синхронизировать.
func (a *App) ReloadPlanFromDir() (store.SyncReport, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.host == nil {
		return store.SyncReport{}, fmt.Errorf("диалог недоступен")
	}
	dir, err := a.host.PickDir("Папка с планом")
	if err != nil || dir == "" {
		return store.SyncReport{}, err
	}
	p, err := plan.LoadDir(dir)
	if err != nil {
		return store.SyncReport{}, fmt.Errorf("Не удалось прочитать план из папки. Проверьте, что в ней лежат файлы этапов")
	}
	rep, err := a.st.Sync(p)
	if err != nil {
		return rep, err
	}
	a.plan, a.planFS, a.lastSync = p, os.DirFS(dir), rep
	a.loadKonspekt(a.planFS)
	_ = a.st.SetSetting("plan_source", dir)
	_ = a.st.SetSetting("plan_version", p.Version)
	_ = a.st.SetSetting("plan_synced_at", a.Now().UTC().Format(time.RFC3339))
	return rep, nil
}

func (a *App) BackupNow() (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.st.Backup("ascent-" + a.Now().Format("2006-01-02_150405") + ".db")
}

// OpenDataDir показывает папку данных в проводнике.
func (a *App) DataDir() string { return a.dir }

func (a *App) OpenURL(url string) {
	if a.host != nil && (strings.HasPrefix(url, "https://") || strings.HasPrefix(url, "http://")) {
		a.host.OpenURL(url)
	}
}

func (a *App) ResetProgress(confirm string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if strings.ToLower(strings.TrimSpace(confirm)) != "сбросить" {
		return fmt.Errorf("введите слово «сбросить»")
	}
	if _, err := a.st.Backup("ascent-before-reset-" + a.Now().Format("2006-01-02_150405") + ".db"); err != nil {
		return err
	}
	if err := a.st.Reset(); err != nil {
		return err
	}
	_ = a.st.SetSetting("onboarded", "0")
	_, err := a.st.Sync(a.plan)
	return err
}

// ---------- экспорт ----------

func (a *App) exportDir() (string, error) {
	if a.host == nil {
		return "", fmt.Errorf("диалог недоступен")
	}
	return a.host.PickDir("Куда сохранить")
}

func (a *App) ExportJSON() (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	dir, err := a.exportDir()
	if err != nil || dir == "" {
		return "", err
	}
	s, err := a.snap()
	if err != nil {
		return "", err
	}
	type row struct {
		ID     string `json:"id"`
		Status string `json:"status"`
		Done   string `json:"doneAt,omitempty"`
		Note   string `json:"note,omitempty"`
		Import bool   `json:"imported,omitempty"`
	}
	var ls []row
	for _, id := range a.plan.Order {
		l := s.in.Lessons[id]
		r := row{ID: id, Status: l.Status, Note: l.Note, Import: l.Imported}
		if l.HasDone() {
			r.Done = l.DoneAt.Format(time.RFC3339)
		}
		ls = append(ls, r)
	}
	chk := map[string]string{}
	for k, t := range s.in.Checks {
		chk[k] = t.Format(time.RFC3339)
	}
	mk := map[string]string{}
	for k, t := range s.in.Markers {
		mk[k] = t.Format(time.RFC3339)
	}
	kq := map[string]string{}
	for k, t := range s.kq {
		kq[k] = t.Format(time.RFC3339)
	}
	rest := []string{}
	for d := range s.in.Rest {
		rest = append(rest, d)
	}
	sort.Strings(rest)
	b, _ := json.MarshalIndent(map[string]any{"planVersion": a.plan.Version, "settings": s.set, "lessons": ls, "checks": chk, "markers": mk, "konspektQuestions": kq, "restDays": rest}, "", "  ")
	p := filepath.Join(dir, "ascent-"+a.Now().Format("2006-01-02")+".json")
	return p, os.WriteFile(p, b, 0o644)
}

func (a *App) ExportMarkdown() (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	dir, err := a.exportDir()
	if err != nil || dir == "" {
		return "", err
	}
	s, err := a.snap()
	if err != nil {
		return "", err
	}
	files, err := plan.Rewrite(a.planFS,
		func(id string) bool { return s.status(id) == "done" },
		func(theme, text string) bool { _, ok := s.in.Checks[store.CheckKey(theme, text)]; return ok })
	if err != nil {
		return "", err
	}
	out := filepath.Join(dir, "Go - ROADMAP (с отметками)")
	if err := os.MkdirAll(out, 0o755); err != nil {
		return "", err
	}
	for name, body := range files {
		if err := os.WriteFile(filepath.Join(out, name), []byte(body), 0o644); err != nil {
			return "", err
		}
	}
	return out, nil
}

// DefaultTemplate — шаблон копирования урока по умолчанию.
func (a *App) DefaultTemplate() string { return store.DefaultHermesTemplate }

func writeImages(dir, name string, images []string) error {
	for i, im := range images {
		if j := strings.Index(im, ","); strings.HasPrefix(im, "data:") && j > 0 {
			im = im[j+1:]
		}
		b, err := base64.StdEncoding.DecodeString(im)
		if err != nil {
			return err
		}
		p := filepath.Join(dir, fmt.Sprintf("%s-%d.png", name, i+1))
		if err := os.WriteFile(p, b, 0o644); err != nil {
			return err
		}
	}
	return nil
}
