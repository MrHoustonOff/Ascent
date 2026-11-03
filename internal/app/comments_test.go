package app

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCommentsAPI(t *testing.T) {
	a, _, _ := newApp(t)
	if _, err := a.AddComment("НЕТ-1", "x"); err == nil {
		t.Fatal("комментарий к несуществующей цели")
	}
	if _, err := a.AddComment("GO-1.2.4", "   "); err == nil {
		t.Fatal("пустой комментарий")
	}
	l, err := a.AddComment("GO-1.2.4", "к уроку")
	if err != nil || l.Kind != "lesson" || l.ThemeID != "GO-1.2" || l.Created == "" || l.StageTitle == "" {
		t.Fatalf("%+v %v", l, err)
	}
	th, _ := a.AddComment("GO-1.2", "к теме")
	a.AddComment("GO-1.2", "ещё к теме")
	if th.Kind != "theme" || th.Ord >= l.Ord {
		t.Fatalf("тема — раньше своих уроков по плану: %+v", th)
	}
	a.SetCommentDone(l.ID, true)
	if cs, _ := a.CommentsFor("GO-1.2.4"); len(cs) != 1 || !cs[0].Done {
		t.Fatalf("%+v", cs)
	}
	if tc, _ := a.ThemeComments(); len(tc["GO-1.2"]) != 2 || tc["GO-1.2"][0] != "к теме" {
		t.Fatalf("%+v", tc)
	}
	// счётчик у урока: всего 1, открытых 0
	s, _ := a.snap()
	if d := s.lessonDTO(a.plan.Lessons["GO-1.2.4"]); d.Notes != [2]int{1, 0} {
		t.Fatalf("%v", d.Notes)
	}
	// стёртый при правке текст — удаление
	a.UpdateComment(l.ID, " ")
	if cs, _ := a.CommentsFor("GO-1.2.4"); len(cs) != 0 {
		t.Fatalf("%+v", cs)
	}
}

func TestSaveAchBadges(t *testing.T) {
	a, _, _ := newApp(t)
	root := t.TempDir()
	a.SetSetting("export_dir", root)
	img := "data:image/png;base64,iVBORw0KGgo="
	dir, err := a.SaveImages("day", "2026-10-25", []string{"Сводка"}, []string{img})
	if err != nil {
		t.Fatal(err)
	}
	sub, err := a.SaveAchBadges(dir, []string{"Первый шаг", "Дубль/2"}, []string{img, img})
	if err != nil || filepath.Base(sub) != "Достижения" {
		t.Fatalf("%q %v", sub, err)
	}
	for _, n := range []string{"01 Первый шаг.png", "02 Дубль-2.png"} {
		if _, err := os.Stat(filepath.Join(sub, n)); err != nil {
			t.Fatal(err)
		}
	}
	// вне папки экспорта и сама папка экспорта — нельзя
	for _, bad := range []string{t.TempDir(), root, filepath.Join(root, "..")} {
		if _, err := a.SaveAchBadges(bad, []string{"x"}, []string{img}); err == nil {
			t.Fatalf("запись вне подпапки экспорта разрешена: %s", bad)
		}
	}
}
