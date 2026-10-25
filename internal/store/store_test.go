package store

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"ascent/internal/plan"
)

func mini(ids ...string) *plan.Plan {
	p := &plan.Plan{Lessons: map[string]*plan.Lesson{}, Blocks: map[string]*plan.Block{}, Themes: map[string]*plan.Theme{}}
	for i, id := range ids {
		p.Lessons[id] = &plan.Lesson{ID: id, Title: "Урок " + id, Ord: i}
		p.Order = append(p.Order, id)
	}
	p.Version = "t"
	return p
}

func open(t *testing.T) *Store {
	t.Helper()
	s, err := Open(filepath.Join(t.TempDir(), "ascent.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { s.Close() })
	return s
}

func TestStartTakesOnlyOneDoing(t *testing.T) {
	s := open(t)
	s.Sync(mini("A-1.1.1", "A-1.1.2"))
	s.StartLesson("A-1.1.1")
	s.StartLesson("A-1.1.2")
	m, _ := s.Lessons()
	if m["A-1.1.1"].Status != "todo" || m["A-1.1.1"].HasStart() {
		t.Fatalf("первый: %+v", m["A-1.1.1"])
	}
	if m["A-1.1.2"].Status != "doing" || !m["A-1.1.2"].HasStart() {
		t.Fatalf("второй: %+v", m["A-1.1.2"])
	}
}

func TestCompleteUndo(t *testing.T) {
	s := open(t)
	s.Sync(mini("A-1.1.1"))
	s.StartLesson("A-1.1.1")
	s.CompleteLesson("A-1.1.1")
	m, _ := s.Lessons()
	if m["A-1.1.1"].Status != "done" || !m["A-1.1.1"].HasDone() || !m["A-1.1.1"].HasStart() {
		t.Fatalf("done: %+v", m["A-1.1.1"])
	}
	s.UndoLesson("A-1.1.1")
	m, _ = s.Lessons()
	l := m["A-1.1.1"]
	if l.Status != "todo" || l.HasDone() || l.HasStart() {
		t.Fatalf("undo: %+v", l)
	}
}

func TestMarkDoneUpToImported(t *testing.T) {
	s := open(t)
	s.Sync(mini("A-1.1.1", "A-1.1.2", "A-1.1.3"))
	n, err := s.MarkDoneUpTo([]string{"A-1.1.1", "A-1.1.2"})
	if err != nil || n != 2 {
		t.Fatal(n, err)
	}
	m, _ := s.Lessons()
	if !m["A-1.1.1"].Imported || m["A-1.1.1"].Status != "done" || m["A-1.1.1"].HasDone() {
		t.Fatalf("%+v", m["A-1.1.1"])
	}
	if m["A-1.1.3"].Status != "todo" {
		t.Fatal("третий тронут")
	}
}

func TestSyncRenumber(t *testing.T) {
	s := open(t)
	s.Sync(mini("A-1.1.1", "A-1.1.2"))
	s.CompleteLesson("A-1.1.2")
	// урок A-1.1.2 стал A-1.1.3 (вставили новый), заголовок прежний
	p := mini("A-1.1.1", "A-1.1.2", "A-1.1.3")
	p.Lessons["A-1.1.3"].Title = "Урок A-1.1.2"
	p.Lessons["A-1.1.2"].Title = "Новый"
	rep, err := s.Sync(p)
	if err != nil {
		t.Fatal(err)
	}
	m, _ := s.Lessons()
	// A-1.1.2 с прогрессом остаётся (есть в плане), новый урок A-1.1.3 todo
	if m["A-1.1.2"].Status != "done" || rep.Added != 1 {
		t.Fatalf("%+v %+v", m["A-1.1.2"], rep)
	}
	// теперь настоящая перенумерация: A-1.1.2 пропал, A-1.1.9 с тем же заголовком
	s2 := open(t)
	s2.Sync(mini("A-1.1.1", "A-1.1.2"))
	s2.CompleteLesson("A-1.1.2")
	q := mini("A-1.1.1", "A-1.1.9")
	q.Lessons["A-1.1.9"].Title = "Урок A-1.1.2"
	rep, _ = s2.Sync(q)
	m, _ = s2.Lessons()
	if rep.Moved != 1 || m["A-1.1.9"].Status != "done" {
		t.Fatalf("перенос: %+v %+v", rep, m["A-1.1.9"])
	}
	if _, ok := m["A-1.1.2"]; ok {
		t.Fatal("старая строка осталась")
	}
}

func TestSyncOrphan(t *testing.T) {
	s := open(t)
	s.Sync(mini("A-1.1.1", "A-1.1.2"))
	s.CompleteLesson("A-1.1.2")
	rep, _ := s.Sync(mini("A-1.1.1"))
	if rep.Orphans != 1 {
		t.Fatalf("%+v", rep)
	}
	o, _ := s.Orphans()
	if len(o) != 1 || o[0].ID != "A-1.1.2" || o[0].Status != "done" {
		t.Fatalf("%+v", o)
	}
}

func TestBackup(t *testing.T) {
	s := open(t)
	s.Sync(mini("A-1.1.1"))
	s.Now = func() time.Time { return time.Date(2026, 10, 25, 12, 0, 0, 0, time.UTC) }
	p, err := s.DailyBackup()
	if err != nil || p == "" {
		t.Fatal(p, err)
	}
	if _, err := os.Stat(p); err != nil {
		t.Fatal(err)
	}
	if p2, _ := s.DailyBackup(); p2 != "" {
		t.Fatal("второй бэкап за день")
	}
	for d := 1; d <= 20; d++ {
		s.Now = func() time.Time { return time.Date(2026, 9, d, 12, 0, 0, 0, time.UTC) }
		s.DailyBackup()
	}
	ents, _ := os.ReadDir(filepath.Join(s.Dir(), "backups"))
	if len(ents) != 14 {
		t.Fatalf("бэкапов %d", len(ents))
	}
}

func TestChecksAndSettings(t *testing.T) {
	s := open(t)
	k := CheckKey("GO-1.1", "вопрос")
	s.SetCheck("GO-1.1", k, true)
	m, _ := s.Checks()
	if _, ok := m[k]; !ok {
		t.Fatal("нет отметки")
	}
	s.SetCheck("GO-1.1", k, false)
	m, _ = s.Checks()
	if len(m) != 0 {
		t.Fatal("не снята")
	}
	st, _ := s.Settings()
	if st["daily_goal"] != "2" {
		t.Fatal(st)
	}
	s.SetSetting("daily_goal", "9")
	st, _ = s.Settings()
	if st["daily_goal"] != "9" {
		t.Fatal(st)
	}
}
