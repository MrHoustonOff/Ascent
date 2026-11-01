package store

import (
	"path/filepath"
	"testing"
)

// База версии 3 со старой заметкой урока и комментариями тем в настройке → после обновления это комментарии «раньше».
func TestCommentsMigrationFromNotes(t *testing.T) {
	p := filepath.Join(t.TempDir(), "ascent.db")
	s, err := Open(p)
	if err != nil {
		t.Fatal(err)
	}
	for _, q := range []string{
		`DROP TABLE comments`,
		`UPDATE schema_version SET version=3`,
		`INSERT INTO lesson_progress(lesson_id,status,note,title_snap) VALUES('GO-1.2.4','doing','заметка урока','x')`,
		`INSERT INTO lesson_progress(lesson_id,status,note,title_snap) VALUES('GO-1.2.5','todo','','x')`,
		`INSERT OR REPLACE INTO settings(key,value) VALUES('theme_notes','{"GO-13.2":"Классная **тема**","GO-7.3":"  "}')`,
	} {
		if _, err := s.db.Exec(q); err != nil {
			t.Fatalf("%s: %v", q, err)
		}
	}
	s.db.Close()
	s, err = Open(p)
	if err != nil {
		t.Fatal(err)
	}
	cs, err := s.Comments()
	if err != nil || len(cs) != 2 {
		t.Fatalf("%v %+v", err, cs)
	}
	got := map[string]string{}
	for _, c := range cs {
		if !c.Created.IsZero() || c.Done {
			t.Fatalf("перенесённый комментарий — без даты и не сделан: %+v", c)
		}
		got[c.Target] = c.Text
	}
	if got["GO-1.2.4"] != "заметка урока" || got["GO-13.2"] != "Классная **тема**" {
		t.Fatalf("%+v", got)
	}
	// новый комментарий: с датой; «сделано» и удаление
	id, err := s.AddComment("GO-1.2.4", "  ещё  ")
	if err != nil {
		t.Fatal(err)
	}
	s.SetCommentDone(id, true)
	cs, _ = s.Comments()
	if c := cs[len(cs)-1]; c.Text != "ещё" || !c.Done || c.Created.IsZero() {
		t.Fatalf("%+v", c)
	}
	s.SetCommentDone(id, false)
	s.UpdateComment(id, "изменён")
	cs, _ = s.Comments()
	if c := cs[len(cs)-1]; c.Done || c.Text != "изменён" {
		t.Fatalf("%+v", c)
	}
	s.DeleteComment(id)
	if cs, _ = s.Comments(); len(cs) != 2 {
		t.Fatalf("после удаления %d", len(cs))
	}
}
