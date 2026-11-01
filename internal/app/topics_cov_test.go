package app

import (
	"io/fs"
	"strings"
	"testing"

	"ascent/internal/topics"
)

// Каждый урок плана — с общими темами или явно помечен «?» в data/*.tsv (прогоны, финальный проект).
func TestTopicsCoverEveryLesson(t *testing.T) {
	a, _, _ := newApp(t)
	marked := map[string]bool{}
	names, _ := fs.Glob(topics.Embedded(), "*.tsv")
	for _, n := range names {
		b, _ := fs.ReadFile(topics.Embedded(), n)
		for _, l := range strings.Split(string(b), "\n") {
			if id, rest, ok := strings.Cut(l, "\t"); ok && strings.TrimSpace(rest) == "?" {
				marked[id] = true
			}
		}
	}
	for id := range a.plan.Lessons {
		if len(a.topics[id]) == 0 && !marked[id] {
			t.Errorf("урок %s без общих тем и без «?»", id)
		}
	}
	for id := range a.topics {
		if a.plan.Lessons[id] == nil {
			t.Errorf("общие темы для несуществующего урока %s", id)
		}
	}
	if k, err := a.Konspekt("GO-1.2.4"); err != nil || len(k.Topics) == 0 || k.Topics[0].RU != "Пакет fmt" || len(k.Topics[0].Links) != 2 {
		t.Fatalf("темы в конспекте: %+v %v", k.Topics, err)
	}
}
