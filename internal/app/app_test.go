package app

import (
	"os"
	"path/filepath"
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
	n, err := a.Next(false)
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
	n, _ = a.Next(false)
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
	nx, _ := a.Next(false)
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

func TestSpeedTarget(t *testing.T) {
	a, _, _ := newApp(t)
	sp, _ := a.Speed()
	if !sp.Empty || sp.Target.Set {
		t.Fatalf("%+v", sp)
	}
	for _, id := range []string{"ФУНД-1.1.1", "ФУНД-1.1.2"} {
		a.CompleteLesson(id)
	}
	a.SetChecksAll("ФУНД-1.1", true)
	a.SetSetting("milestone_target", "2027-01-31")
	sp, _ = a.Speed()
	if sp.Empty || !sp.Target.Set || sp.Target.Need <= 0 || sp.Target.Verdict == "" || len(sp.Series) == 0 {
		t.Fatalf("%+v", sp.Target)
	}
	if err := a.SetSetting("daily_goal", "3"); err == nil {
		t.Fatal("дневная цель больше не настраивается")
	}
}

func TestKonspekt(t *testing.T) {
	a, h, _ := newApp(t)
	k, err := a.Konspekt("ФУНД-1.2.1")
	if err != nil || len(k.Qs) < 2 || len(k.Know) == 0 || k.Done != 0 {
		t.Fatalf("%+v %v", k, err)
	}
	if err := a.SetKQ("ФУНД-1.2.1", 2, true); err != nil {
		t.Fatal(err)
	}
	if err := a.SetKQ("ФУНД-1.2.1", 99, true); err == nil {
		t.Fatal("номер вне диапазона принят")
	}
	k, _ = a.Konspekt("ФУНД-1.2.1")
	if k.Done != 1 || !k.Qs[1].Done || k.Qs[0].Done {
		t.Fatalf("отметка: %+v", k.Qs)
	}
	th, _ := a.Theme("ФУНД-1.2")
	if th.Lessons[0].KQ != len(k.Qs) || th.Lessons[0].KQDone != 1 {
		t.Fatalf("счётчик в строке урока: %+v", th.Lessons[0])
	}
	// закрытие темы от вопросов конспекта не зависит
	if th.Closed {
		t.Fatal("тема закрылась от вопроса конспекта")
	}
	var rel bool
	for _, l := range k.Later {
		for _, x := range l.Links {
			if strings.HasPrefix(x.Rel, "через ") || strings.Contains(x.Rel, "в этой теме") {
				rel = true
			}
		}
	}
	if !rel {
		t.Fatalf("нет относительных ссылок: %+v", k.Later)
	}
	if _, err := a.Copy("konspekt", "ФУНД-1.2.1"); err != nil || !strings.Contains(h.clip, "Должен знать:") {
		t.Fatalf("%q %v", h.clip, err)
	}
	r, _ := a.Konspekt("ПРОГОН-1")
	if len(r.Qs) == 0 || len(r.Qs[0].Refs) == 0 || r.Qs[0].Refs[0].Rel == "" {
		t.Fatalf("прогон: %+v", r.Qs)
	}
}

func TestZoomSettings(t *testing.T) {
	a, _, _ := newApp(t)
	if err := a.SetSetting("ui_zoom", "125"); err != nil {
		t.Fatal(err)
	}
	if err := a.SetSetting("ui_zoom", "500"); err == nil {
		t.Fatal("масштаб вне диапазона принят")
	}
	if err := a.SetSetting("zoom_gopher", "2"); err == nil {
		t.Fatal("zoom_gopher принимает только 0 и 1")
	}
	if s, _ := a.Settings(); s["ui_zoom"] != "125" || s["zoom_gopher"] != "1" {
		t.Fatalf("%v", s)
	}
}

func TestRecapPeriodsAndExport(t *testing.T) {
	a, _, _ := newApp(t)
	for _, id := range []string{"ФУНД-1.1.1", "ФУНД-1.1.2"} {
		a.CompleteLesson(id)
	}
	a.SetChecksAll("ФУНД-1.1", true)
	m, err := a.Recap("month", "")
	if err != nil || m.Title != "Итоги месяца" || len(m.Themes) != 1 || m.BestDay == nil || m.BestWeek == nil || m.Prev != 0 {
		t.Fatalf("месяц: %+v %v", m, err)
	}
	if len(m.Heat)%7 != 0 || len(m.Heat) < 35 || len(m.Tracks) != 6 || len(m.Stages) != 7 || len(m.Forecast) == 0 {
		t.Fatalf("данные карточек: heat %d tracks %d stages %d forecast %d", len(m.Heat), len(m.Tracks), len(m.Stages), len(m.Forecast))
	}
	all, _ := a.Recap("all", "")
	if all.Title != "Весь путь" || all.Prev != -1 || len(all.Days) != 0 || len(all.Themes) != 1 {
		t.Fatalf("весь путь: %+v", all)
	}
	empty, _ := a.Recap("day", "2026-10-20")
	if !empty.Empty || empty.Prev != 0 || empty.PrevLabel != "вчера" {
		t.Fatalf("пустой день: %+v", empty)
	}
	// день X: с первой закрытой темы; до неё — 0
	if all.DayN != 1 || all.Start == "" || len(all.Milestones) == 0 || all.Milestones[0].Label != "Первая тема" || empty.DayN != 0 {
		t.Fatalf("день X: all %d %q %+v · до темы %d", all.DayN, all.Start, all.Milestones, empty.DayN)
	}
	if later, _ := a.Recap("day", a.Now().In(a.Loc).AddDate(0, 0, 9).Format("2006-01-02")); later.DayN != 1 {
		t.Fatalf("день X не уходит в будущее: %d", later.DayN)
	}
	// произвольный период: даты можно перепутать, сравнение — со столькими же днями до него
	rg, _ := a.Recap("range", "2026-10-25..2026-10-12")
	if rg.Title != "Итоги периода" || rg.From != "2026-10-12" || rg.Date != "2026-10-25" || rg.RangeDays != 14 || len(rg.Days) != 14 || len(rg.Themes) != 1 || rg.Prev != 0 {
		t.Fatalf("период: %+v", rg)
	}
	if def, _ := a.Recap("range", ""); def.RangeDays != 14 || def.Date != a.Now().In(a.Loc).Format("2006-01-02") {
		t.Fatalf("период по умолчанию: %d %s", def.RangeDays, def.Date)
	}
	if long, _ := a.Recap("range", "2020-01-01..2026-10-25"); long.RangeDays != maxRangeDays+1 || len(long.Days) != 0 {
		t.Fatalf("длинный период: %d дней, %d столбиков", long.RangeDays, len(long.Days))
	}
	// экспорт: подпапка на каждый экспорт внутри запомненной папки
	root := t.TempDir()
	a.SetSetting("export_dir", root)
	img := "data:image/png;base64,iVBORw0KGgo="
	d1, err := a.SaveImages("day", "2026-10-25", []string{"Сводка", "Темы/блоки"}, []string{img, img})
	if err != nil || filepath.Base(d1) != "Итоги дня 25.10.26" {
		t.Fatalf("%q %v", d1, err)
	}
	if _, err := os.Stat(filepath.Join(d1, "02 Темы-блоки.png")); err != nil {
		t.Fatal(err)
	}
	d2, _ := a.SaveImages("day", "2026-10-25", nil, []string{img})
	if filepath.Base(d2) != "Итоги дня 25.10.26 (2)" {
		t.Fatalf("повтор: %q", d2)
	}
	if r, _ := a.SaveImages("range", "2026-10-01..2026-10-26", nil, []string{img}); filepath.Base(r) != "Итоги 01.10–26.10.26" {
		t.Fatalf("период: %q", r)
	}
	if r, _ := a.SaveImages("range", "2025-12-20..2026-01-10", nil, []string{img}); filepath.Base(r) != "Итоги 20.12.25–10.01.26" {
		t.Fatalf("период через год: %q", r)
	}
	w, _ := a.SaveImages("week", "2026-10-21", nil, []string{img})
	if filepath.Base(w) != "Итоги недели 19.10–25.10.26" {
		t.Fatalf("неделя: %q", w)
	}
}
