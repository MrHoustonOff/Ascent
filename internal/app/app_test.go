package app

import (
	"strings"
	"testing"
	"time"
)

type fakeHost struct{ clip string }

func (h *fakeHost) ClipboardSet(t string) error    { h.clip = t; return nil }
func (h *fakeHost) OpenURL(string)                 {}
func (h *fakeHost) PickDir(string) (string, error) { return "", nil }

var msk = time.FixedZone("MSK", 3*3600)

func newApp(t *testing.T) (*App, *fakeHost, *time.Time) {
	t.Helper()
	h := &fakeHost{}
	now := time.Date(2026, 10, 25, 21, 0, 0, 0, msk)
	a, err := New(t.TempDir(), h, func() time.Time { return now }, msk)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { Shutdown(a) })
	return a, h, &now
}

func TestFirstRunFlow(t *testing.T) {
	a, h, _ := newApp(t)
	n, err := a.Next(false, false)
	if err != nil || n.Card != "lesson_todo" || n.Lesson.ID != "ФУНД-1.1.1" {
		t.Fatalf("%+v %v", n, err)
	}
	n, err = a.StartLesson("ФУНД-1.1.1")
	if err != nil || n.Card != "lesson_doing" || !strings.Contains(h.clip, "Урок ФУНД-1.1.1") {
		t.Fatalf("%+v %q", n, h.clip)
	}
	if _, err := a.CompleteLesson("ФУНД-1.1.1"); err != nil {
		t.Fatal(err)
	}
	if _, err := a.CompleteLesson("ФУНД-1.1.2"); err != nil {
		t.Fatal(err)
	}
	// тема не закрыта без вопросов → карточка проверки
	n, _ = a.Next(false, false)
	if n.Card != "theme_check" || len(n.Checks) != 2 {
		t.Fatalf("%+v", n)
	}
	r, _ := a.SetCheck("ФУНД-1.1", 1, true)
	if r.ThemeClosed != nil {
		t.Fatal("закрылась рано")
	}
	r, _ = a.SetCheck("ФУНД-1.1", 2, true)
	if r.ThemeClosed == nil || r.ThemeClosed.ID != "ФУНД-1.1" {
		t.Fatalf("%+v", r)
	}
	td, _ := a.Today()
	if td.DoneToday != 1 || td.Fresh {
		t.Fatalf("%+v", td)
	}
}

func TestGoalDone(t *testing.T) {
	a, _, _ := newApp(t)
	for _, id := range []string{"ФУНД-1.1", "ФУНД-1.2"} {
		th := a.plan.Themes[id]
		for _, l := range th.Lessons {
			a.CompleteLesson(l.ID)
		}
		for i := range th.Checks {
			a.SetCheck(id, i+1, true)
		}
	}
	n, _ := a.Next(false, false)
	if n.Card != "goal_done" || n.NextID != "ФУНД-1.3.1" {
		t.Fatalf("%+v", n)
	}
	n, _ = a.Next(false, true)
	if n.Card != "lesson_todo" {
		t.Fatalf("%+v", n.Card)
	}
}

func TestCopyAndDocs(t *testing.T) {
	a, h, _ := newApp(t)
	txt, err := a.Copy("lesson", "GO-7.3.4")
	if err != nil || !strings.HasPrefix(txt, "Тема GO-7.3 append\n> ") || h.clip != txt {
		t.Fatal(txt, err)
	}
	d, err := a.Doc("00")
	if err != nil || !strings.Contains(d.HTML, `data-doc="98"`) || !strings.Contains(d.HTML, `data-goto="`) {
		t.Fatal(err, len(d.HTML))
	}
	hits, _ := a.Search("GO-7.3")
	if len(hits) == 0 || hits[0].ID != "GO-7.3" {
		t.Fatalf("%+v", hits[:1])
	}
	b, _ := a.Bank(BankFilter{Markers: true})
	if len(b.Items) != 141 {
		t.Fatal(len(b.Items))
	}
	if err := a.ResetProgress("нет"); err == nil {
		t.Fatal("сброс без слова")
	}
}

func TestImportedThemesClosed(t *testing.T) {
	a, _, _ := newApp(t)
	n, err := a.MarkDoneUpTo("GO-1.1.1")
	if err != nil || n == 0 {
		t.Fatal(n, err)
	}
	nx, _ := a.Next(false, false)
	if nx.Card != "lesson_todo" || nx.Lesson.ID != "GO-1.1.1" {
		t.Fatalf("%+v", nx)
	}
	tr, _ := a.Tree()
	if tr.Stages[0].Blocks[0].State != "done" {
		t.Fatalf("%+v", tr.Stages[0].Blocks[0].NodeDTO)
	}
	// массовая отметка не попадает в темп
	v, _ := a.Velocity()
	if !v.Empty {
		t.Fatal("импорт попал в статистику")
	}
}

func TestAchievementsSecret(t *testing.T) {
	a, _, _ := newApp(t)
	l, _ := a.Achievements()
	if l.Total < 50 || l.Unlocked != 0 {
		t.Fatalf("%+v", l)
	}
	for _, x := range l.Items {
		if x.Name != "" || x.Desc != "" {
			t.Fatal("секретное достижение выдало название")
		}
	}
	for _, id := range []string{"ФУНД-1.1.1", "ФУНД-1.1.2"} {
		a.CompleteLesson(id)
	}
	a.SetCheck("ФУНД-1.1", 1, true)
	r, _ := a.SetCheck("ФУНД-1.1", 2, true)
	if len(r.Achievements) == 0 || r.Achievements[0].ID != "t1" {
		t.Fatalf("%+v", r.Achievements)
	}
	l, _ = a.Achievements()
	if l.Unlocked == 0 || l.Items[0].Name == "" || l.Items[0].When == "" || l.New == 0 {
		t.Fatalf("%+v", l.Items[0])
	}
	a.MarkAchievementsSeen()
	if l, _ = a.Achievements(); l.New != 0 {
		t.Fatal("отметка «новое» не снялась")
	}
}

func TestRecapAndInsights(t *testing.T) {
	a, _, _ := newApp(t)
	for _, id := range []string{"ФУНД-1.1.1", "ФУНД-1.1.2"} {
		a.CompleteLesson(id)
	}
	a.SetChecksAll("ФУНД-1.1", true)
	r, err := a.Recap("day", "")
	if err != nil || len(r.Themes) != 1 || r.Lessons != 2 || r.Checks != 2 || len(r.Achievements) == 0 {
		t.Fatalf("%+v %v", r, err)
	}
	w, _ := a.Recap("week", "2026-10-21")
	if len(w.Days) != 7 || len(w.Themes) != 1 {
		t.Fatalf("%+v", w)
	}
	in, _ := a.Insights()
	if in.Empty || in.ThemesTotal != 1 || in.BestWeekday != "воскресенье" {
		t.Fatalf("%+v", in)
	}
}

func TestMotd(t *testing.T) {
	a, _, _ := newApp(t)
	td, _ := a.Today()
	if td.Motd == "" || strings.Contains(td.Motd, "!") {
		t.Fatal(td.Motd)
	}
	a.CompleteLesson("ФУНД-1.1.1")
	td, _ = a.Today()
	if td.Motd == "" || strings.Contains(td.Motd, "!") {
		t.Fatal(td.Motd)
	}
	for k, xs := range motdBlock {
		if a.plan.Blocks[k] == nil {
			t.Errorf("нет блока %s", k)
		}
		for _, x := range xs {
			if strings.Contains(strings.ReplaceAll(x, "!=", ""), "!") {
				t.Errorf("восклицание: %s", x)
			}
		}
	}
}
