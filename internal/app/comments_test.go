package app

import "testing"

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
