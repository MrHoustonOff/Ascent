package stats

import (
	"math"
	"sort"
	"strconv"
	"time"

	"ascent/internal/plan"
	"ascent/internal/store"
)

type Settings struct {
	DayStartHour   int
	RestPerWeek    int
	ProjectDays    int
	MilestoneStage int
	MilestoneDate  string // YYYY-MM-DD или пусто
}

// Input — всё, что нужно для подсчётов.
type Input struct {
	Plan    *plan.Plan
	Lessons map[string]store.Lesson
	Checks  map[string]time.Time // check_key -> done_at
	Markers map[string]time.Time // marker_key -> done_at
	Rest    map[string]bool
	S       Settings
	Now     time.Time
	Loc     *time.Location
}

func (in *Input) Today() time.Time {
	return ParseDay(StudyDay(in.Now, in.Loc, in.S.DayStartHour))
}

func (in *Input) day(t time.Time) string { return StudyDay(t, in.Loc, in.S.DayStartHour) }

// Daily — агрегаты за учебные дни.
type Daily struct {
	Themes int // темы, закрытые в этот день (и прогоны)
	Active bool
}

// ThemeClosedAt возвращает момент закрытия темы: все уроки пройдены и все вопросы отмечены.
// Время — самая поздняя отметка урока или вопроса. Закрытые массовой отметкой без
// единой пользовательской отметки времени не имеют и в темп не идут.
func (in *Input) ThemeClosedAt(th *plan.Theme) (time.Time, bool) {
	var at time.Time
	for _, l := range th.Lessons {
		r := in.Lessons[l.ID]
		if r.Status != "done" {
			return time.Time{}, false
		}
		if !r.Imported && r.HasDone() && r.DoneAt.After(at) {
			at = r.DoneAt
		}
	}
	for _, c := range th.Checks {
		t, ok := in.Checks[store.CheckKey(th.ID, c)]
		if !ok {
			return time.Time{}, false
		}
		if t.After(at) {
			at = t
		}
	}
	return at, !at.IsZero()
}

// Aggregates возвращает по учебным дням число закрытых тем и признак активности.
// Единственная единица темпа — тема; урок времени не имеет.
func (in *Input) Aggregates() map[string]*Daily {
	m := map[string]*Daily{}
	get := func(k string) *Daily {
		d := m[k]
		if d == nil {
			d = &Daily{}
			m[k] = d
		}
		return d
	}
	for _, l := range in.Lessons {
		if l.Status == "done" && !l.Imported && l.HasDone() {
			get(in.day(l.DoneAt)).Active = true
		}
	}
	for _, t := range in.Checks {
		get(in.day(t)).Active = true
	}
	for _, t := range in.Markers {
		get(in.day(t)).Active = true
	}
	for _, th := range in.Plan.Themes {
		if at, ok := in.ThemeClosedAt(th); ok {
			get(in.day(at)).Themes++
		}
	}
	for _, b := range in.Plan.Blocks {
		if b.Run != nil {
			if r := in.Lessons[b.Run.ID]; r.Status == "done" && !r.Imported && r.HasDone() {
				get(in.day(r.DoneAt)).Themes++
			}
		}
	}
	return m
}

// ActiveDays — дни, в которые пройден урок или отмечен вопрос/маркер.
func (in *Input) ActiveDays() map[string]bool {
	out := map[string]bool{}
	for k, d := range in.Aggregates() {
		if d.Active {
			out[k] = true
		}
	}
	return out
}

// FirstActive — первый активный учебный день (zero, если истории нет).
func (in *Input) FirstActive() (time.Time, bool) {
	var first time.Time
	for k := range in.ActiveDays() {
		t := ParseDay(k)
		if first.IsZero() || t.Before(first) {
			first = t
		}
	}
	return first, !first.IsZero()
}

// Window — результат подсчёта темпа за окно.
type Window struct {
	N, NEff int
	Themes  int
	V       float64
}

// Pace считает v_N: закрытых тем в день.
func (in *Input) Pace(n int) Window {
	w := Window{N: n}
	today := in.Today()
	first, ok := in.FirstActive()
	if !ok {
		return w
	}
	hist := DaysBetween(first, today) + 1
	w.NEff = n
	if hist < n {
		w.NEff = hist
	}
	if w.NEff < 1 {
		w.NEff = 1
	}
	from := today.AddDate(0, 0, -(n - 1))
	agg := in.Aggregates()
	for d := from; !d.After(today); d = d.AddDate(0, 0, 1) {
		if a := agg[key(d)]; a != nil {
			w.Themes += a.Themes
		}
	}
	w.V = float64(w.Themes) / float64(w.NEff)
	return w
}

// AllTimePace — тем в день за всю историю.
func (in *Input) AllTimePace() float64 {
	first, ok := in.FirstActive()
	if !ok {
		return 0
	}
	n := 0
	for _, a := range in.Aggregates() {
		n += a.Themes
	}
	return float64(n) / float64(DaysBetween(first, in.Today())+1)
}

// HistoryDays — длина истории в учебных днях.
func (in *Input) HistoryDays() int {
	first, ok := in.FirstActive()
	if !ok {
		return 0
	}
	return DaysBetween(first, in.Today()) + 1
}

// Rate возвращает основной темп (v14), вилку и признак «мало истории».
func (in *Input) Rate() (v, vmin, vmax float64, young bool) {
	w14 := in.Pace(14)
	v = w14.V
	first := true
	for _, n := range []int{7, 14, 28} {
		w := in.Pace(n)
		if w.NEff < 7 {
			continue
		}
		if first || w.V < vmin {
			vmin = w.V
		}
		if first || w.V > vmax {
			vmax = w.V
		}
		first = false
	}
	if first {
		vmin, vmax = v, v
	}
	young = in.HistoryDays() < 7
	return
}

// ---------- прогноз ----------

type Target struct {
	Key, Label string
	Ahead      int
	HasProject bool
}

// Targets — цели прогноза: текущий блок, этап, веха, весь путь. Считаем в темах
// (прогон этапа — одна единица, проект — срок project_days).
func (in *Input) Targets() []Target {
	p := in.Plan
	next := in.NextLesson()
	lessonDone := func(id string) bool { return in.Lessons[id].Status == "done" }
	themeOpen := func(th *plan.Theme) bool { return !in.ThemeClosed(th) }
	// считает открытые единицы в целях, выбранных предикатом по блоку
	count := func(pred func(*plan.Block) bool) (n int, proj bool) {
		for _, s := range p.Stages {
			for _, b := range s.Blocks {
				if !pred(b) {
					continue
				}
				for _, th := range b.Themes {
					if themeOpen(th) {
						n++
					}
					for _, l := range th.Lessons {
						if l.Kind == "project" && !lessonDone(l.ID) {
							proj = true
						}
					}
				}
				if b.Run != nil && !lessonDone(b.Run.ID) {
					n++
				}
			}
		}
		return
	}
	var out []Target
	if next != nil {
		if next.Theme != "" {
			th := p.Themes[next.Theme]
			n := 0
			if themeOpen(th) {
				n = 1
			}
			out = append(out, Target{"theme", "Тема " + next.Theme, n, false})
		}
		n, pr := count(func(b *plan.Block) bool { return b.ID == next.Block })
		out = append(out, Target{"block", "Блок " + next.Block, n, pr})
		n, pr = count(func(b *plan.Block) bool { return b.Stage == next.Stage })
		out = append(out, Target{"stage", "Этап " + itoa(next.Stage), n, pr})
	}
	ms := in.S.MilestoneStage
	if ms < 1 {
		ms = 3
	}
	n, pr := count(func(b *plan.Block) bool { return b.Stage <= ms })
	out = append(out, Target{"milestone", "Веха «можно на собесы»", n, pr})
	n, pr = count(func(*plan.Block) bool { return true })
	out = append(out, Target{"path", "Весь путь", n, pr})
	return out
}

func itoa(n int) string { return strconv.Itoa(n) }

// NextLesson — следующий урок по правилу 8.2.
func (in *Input) NextLesson() *plan.Lesson {
	for _, id := range in.Plan.Order {
		if in.Lessons[id].Status == "doing" {
			return in.Plan.Lessons[id]
		}
	}
	for _, id := range in.Plan.Order {
		if in.Lessons[id].Status != "done" {
			return in.Plan.Lessons[id]
		}
	}
	return nil
}

// DaysFor — число дней до завершения цели при темпе v.
func DaysFor(ahead int, v float64, hasProject bool, projectDays int) int {
	if ahead == 0 {
		return 0
	}
	d := int(math.Ceil(float64(ahead) / v))
	if hasProject {
		d += projectDays
	}
	return d
}

type Forecast struct {
	Key, Label string
	Ahead      int
	Date       string // YYYY-MM-DD, пусто если v=0
	From, To   string // вилка
	Days       int
}

// Forecasts считает прогноз по всем целям.
func (in *Input) Forecasts() []Forecast {
	v, _, _, _ := in.Rate()
	today := in.Today()
	// вилка по окнам с N_eff ≥ 7
	var vs []float64
	for _, n := range []int{7, 14, 28} {
		if w := in.Pace(n); w.NEff >= 7 && w.V > 0 {
			vs = append(vs, w.V)
		}
	}
	sort.Float64s(vs)
	var out []Forecast
	for _, t := range in.Targets() {
		f := Forecast{Key: t.Key, Label: t.Label, Ahead: t.Ahead}
		if t.Ahead == 0 {
			f.Date = key(today)
			out = append(out, f)
			continue
		}
		if v > 0 {
			f.Days = DaysFor(t.Ahead, v, t.HasProject, in.S.ProjectDays)
			f.Date = key(today.AddDate(0, 0, f.Days))
			if len(vs) >= 2 {
				fast := DaysFor(t.Ahead, vs[len(vs)-1], t.HasProject, in.S.ProjectDays)
				slow := DaysFor(t.Ahead, vs[0], t.HasProject, in.S.ProjectDays)
				if fast != slow {
					f.From = key(today.AddDate(0, 0, fast))
					f.To = key(today.AddDate(0, 0, slow))
				}
			}
		}
		out = append(out, f)
	}
	return out
}

// NeededPace — нужный темп, чтобы дойти до вехи к target (уроков в день).
func (in *Input) NeededPace(target string) (float64, bool) {
	if target == "" {
		return 0, false
	}
	t := ParseDay(target)
	days := DaysBetween(in.Today(), t)
	if days < 1 {
		return 0, false
	}
	for _, x := range in.Targets() {
		if x.Key == "milestone" {
			return math.Ceil(float64(x.Ahead) / float64(days)), true
		}
	}
	return 0, false
}

// ---------- хитмапа ----------

type HeatDay struct {
	Day    string `json:"day"`
	Themes int    `json:"themes"`
	Active bool   `json:"active"`
	Rest   bool   `json:"rest"`
	Level  int    `json:"level"`
}

// Heat возвращает все учебные дни от from до to включительно.
// День с работой, но без закрытой темы, получает уровень 1.
func (in *Input) Heat(from, to string) []HeatDay {
	agg := in.Aggregates()
	avg := in.AvgPerThemeDay()
	var out []HeatDay
	f, t := ParseDay(from), ParseDay(to)
	for d := f; !d.After(t); d = d.AddDate(0, 0, 1) {
		k := key(d)
		h := HeatDay{Day: k, Rest: in.Rest[k]}
		if a := agg[k]; a != nil {
			h.Themes, h.Active = a.Themes, a.Active
		}
		h.Level = Level(h.Themes, avg)
		if h.Level == 0 && h.Active {
			h.Level = 1
		}
		out = append(out, h)
	}
	return out
}

// AvgPerThemeDay — сколько тем в среднем закрывается за день, в который тема вообще закрывалась.
func (in *Input) AvgPerThemeDay() float64 {
	n, d := 0, 0
	for _, a := range in.Aggregates() {
		if a.Themes > 0 {
			n += a.Themes
			d++
		}
	}
	if d == 0 {
		return 0
	}
	return float64(n) / float64(d)
}
