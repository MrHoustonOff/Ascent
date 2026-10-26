package stats

import (
	"testing"
	"time"

	"ascent/internal/plan"
	"ascent/internal/store"
)

var msk = time.FixedZone("MSK", 3*3600)

func d(s string) time.Time { return ParseDay(s) }

func TestStudyDay(t *testing.T) {
	at := time.Date(2026, 10, 26, 1, 30, 0, 0, msk)
	if got := StudyDay(at, msk, 4); got != "2026-10-25" {
		t.Fatal(got)
	}
	if got := StudyDay(at, msk, 0); got != "2026-10-26" {
		t.Fatal(got)
	}
}

func set(days ...string) map[string]bool {
	m := map[string]bool{}
	for _, x := range days {
		m[x] = true
	}
	return m
}

func TestStreak(t *testing.T) {
	today := d("2026-10-25")
	if n := CurrentStreak(set("2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"), nil, today); n != 5 {
		t.Fatal(n)
	}
	// отдых посередине сохраняет серию, но не растит её
	if n := CurrentStreak(set("2026-10-22", "2026-10-24", "2026-10-25"), set("2026-10-23"), today); n != 3 {
		t.Fatal(n)
	}
	// пустой день без отдыха рвёт серию
	if n := CurrentStreak(set("2026-10-21", "2026-10-23", "2026-10-24", "2026-10-25"), nil, today); n != 3 {
		t.Fatal(n)
	}
	// сегодня пусто, вчера активно
	if n := CurrentStreak(set("2026-10-23", "2026-10-24"), nil, today); n != 2 {
		t.Fatal(n)
	}
	if n := BestStreak(set("2026-10-01", "2026-10-02", "2026-10-03", "2026-10-10"), nil); n != 3 {
		t.Fatal(n)
	}
}

func TestRestQuota(t *testing.T) {
	today := d("2026-10-25") // воскресенье
	rest := set("2026-10-20")
	if CanRest(nil, rest, today, 1) {
		t.Fatal("квота исчерпана")
	}
	if !CanRest(nil, set("2026-10-19"), d("2026-10-26"), 1) {
		t.Fatal("новая неделя")
	}
	if CanRest(set("2026-10-25"), nil, today, 1) {
		t.Fatal("есть активность")
	}
}

func TestLevel(t *testing.T) {
	// относительно своей средней (2 темы): 0 → 0, 1 → l1, 2 → l2, 3 → l3, 4+ → l4
	for n, w := range map[int]int{0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 7: 4} {
		if got := Level(n, 2); got != w {
			t.Errorf("n=%d: %d, ожидалось %d", n, got, w)
		}
	}
	if Level(1, 0) != 2 {
		t.Error("без истории одна тема — средний уровень")
	}
}

// ---------- сценарии на мини-плане ----------

func mini() *plan.Plan {
	p := &plan.Plan{Lessons: map[string]*plan.Lesson{}, Blocks: map[string]*plan.Block{}, Themes: map[string]*plan.Theme{}}
	st := &plan.Stage{Num: 1}
	b := &plan.Block{ID: "A-1", Stage: 1}
	st.Blocks = append(st.Blocks, b)
	p.Blocks[b.ID] = b
	p.Stages = append(p.Stages, st)
	for i := 1; i <= 10; i++ {
		th := &plan.Theme{ID: "A-1." + string(rune('0'+i%10)) + string(rune('a'+i)), Block: "A-1", Stage: 1, Checks: []string{"в"}}
		l := &plan.Lesson{ID: th.ID + ".1", Title: "u", Theme: th.ID, Block: "A-1", Stage: 1, Kind: "lesson", Ord: len(p.Order)}
		th.Lessons = []*plan.Lesson{l}
		b.Themes = append(b.Themes, th)
		p.Themes[th.ID] = th
		p.Lessons[l.ID] = l
		p.Order = append(p.Order, l.ID)
	}
	return p
}

type env struct {
	p       *plan.Plan
	lessons map[string]store.Lesson
	checks  map[string]time.Time
}

func newEnv() *env {
	p := mini()
	e := &env{p: p, lessons: map[string]store.Lesson{}, checks: map[string]time.Time{}}
	for _, id := range p.Order {
		e.lessons[id] = store.Lesson{ID: id, Status: "todo"}
	}
	return e
}

// closeTheme закрывает i-ю тему в момент at.
func (e *env) closeTheme(i int, at time.Time) {
	th := e.p.Blocks["A-1"].Themes[i]
	l := th.Lessons[0]
	e.lessons[l.ID] = store.Lesson{ID: l.ID, Status: "done", DoneAt: at.UTC(), StartedAt: at.UTC().Add(-time.Hour)}
	e.checks[store.CheckKey(th.ID, "в")] = at.UTC()
}

func (e *env) in(now time.Time) *Input {
	return &Input{Plan: e.p, Lessons: e.lessons, Checks: e.checks, Rest: map[string]bool{}, Now: now, Loc: msk,
		S: Settings{DayStartHour: 4, RestPerWeek: 1, ProjectDays: 4, MilestoneStage: 1}}
}

func TestPaceThemes(t *testing.T) {
	e := newEnv()
	now := time.Date(2026, 10, 25, 21, 0, 0, 0, msk)
	// 7 тем за 7 дней (по одной в день), история 7 дней
	for i := 0; i < 7; i++ {
		e.closeTheme(i, now.AddDate(0, 0, -i))
	}
	in := e.in(now)
	if w := in.Pace(7); w.Themes != 7 || w.NEff != 7 || w.V != 1 {
		t.Fatalf("v7: %+v", w)
	}
	if w := in.Pace(14); w.NEff != 7 || w.V != 1 {
		t.Fatalf("v14: %+v", w)
	}
	// история 3 дня
	e2 := newEnv()
	for i := 0; i < 3; i++ {
		e2.closeTheme(i, now.AddDate(0, 0, -i))
	}
	if w := e2.in(now).Pace(7); w.NEff != 3 {
		t.Fatalf("neff: %+v", w)
	}
}

func TestThemeNeedsChecks(t *testing.T) {
	e := newEnv()
	now := time.Date(2026, 10, 25, 21, 0, 0, 0, msk)
	th := e.p.Blocks["A-1"].Themes[0]
	e.lessons[th.Lessons[0].ID] = store.Lesson{ID: th.Lessons[0].ID, Status: "done", DoneAt: now.UTC()}
	if _, ok := e.in(now).ThemeClosedAt(th); ok {
		t.Fatal("тема закрыта без вопросов")
	}
	if w := e.in(now).Pace(7); w.Themes != 0 {
		t.Fatal("тема засчитана")
	}
}

func TestForecastThemes(t *testing.T) {
	e := newEnv()
	now := time.Date(2026, 10, 25, 21, 0, 0, 0, msk)
	for i := 0; i < 7; i++ {
		e.closeTheme(i, now.AddDate(0, 0, -i))
	}
	// впереди 3 темы, v = 1 → 3 дня
	var f Forecast
	for _, x := range e.in(now).Forecasts() {
		if x.Key == "block" {
			f = x
		}
	}
	if f.Ahead != 3 || f.Date != "2026-10-28" {
		t.Fatalf("%+v", f)
	}
	if DaysFor(10, 3, false, 4) != 4 || DaysFor(10, 3, true, 4) != 8 {
		t.Fatal("DaysFor")
	}
}

func TestNoDurationsAnywhere(t *testing.T) {
	// урок не имеет времени: агрегаты содержат только темы и признак активности
	e := newEnv()
	now := time.Date(2026, 10, 25, 21, 0, 0, 0, msk)
	e.closeTheme(0, now)
	for _, a := range e.in(now).Aggregates() {
		if a.Themes != 1 || !a.Active {
			t.Fatalf("%+v", a)
		}
	}
}

func TestHeatActiveWithoutTheme(t *testing.T) {
	e := newEnv()
	now := time.Date(2026, 10, 25, 21, 0, 0, 0, msk)
	id := e.p.Order[0]
	e.lessons[id] = store.Lesson{ID: id, Status: "done", DoneAt: now.UTC()}
	h := e.in(now).Heat("2026-10-25", "2026-10-25")
	if h[0].Themes != 0 || h[0].Level != 1 {
		t.Fatalf("%+v", h[0])
	}
}
