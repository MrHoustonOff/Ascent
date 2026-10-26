package konspekt

import (
	"testing"

	"ascent/internal/plan"
)

func TestEmbeddedCoversPlan(t *testing.T) {
	p, err := plan.LoadEmbedded()
	if err != nil {
		t.Fatal(err)
	}
	k, err := Parse(Embedded())
	if err != nil {
		t.Fatal(err)
	}
	keys := map[string]bool{}
	for _, id := range p.Order {
		l := k[id]
		if l == nil {
			t.Errorf("%s: нет конспекта", id)
			continue
		}
		if len(l.Qs) < 2 || len(l.Know) == 0 || len(l.Terms) == 0 {
			t.Errorf("%s: неполный конспект (вопросов %d, абзацев %d, терминов %d)", id, len(l.Qs), len(l.Know), len(l.Terms))
		}
		for _, q := range l.Qs {
			if keys[q.Key] {
				t.Errorf("%s: повтор ключа вопроса %q", id, q.Text)
			}
			keys[q.Key] = true
			for _, r := range q.Refs {
				if p.Lessons[r] == nil {
					t.Errorf("%s: ссылка на неизвестный урок %s", id, r)
				}
			}
		}
	}
	for id := range k {
		if p.Lessons[id] == nil {
			t.Errorf("конспект %s без урока в плане", id)
		}
	}
}

func TestParseLesson(t *testing.T) {
	src := "## X-1. Блок\n### X-1.1 Тема\n#### X-1.1.1 Урок\n**Вопросы**\n- [ ] Что такое `go`? · `what is go`\n- [ ] Прогон · X-1.1.2, X-1.1.3\n- [ ] Без запроса\n\n" +
		"**Гуглить:** `a b` · `c`\n\n**Должен знать**\nПервый абзац.\nВторой `код`.\n\n**Термины**\n- **слово** *(новое)* — пояснение\n- **другое** — ещё\n\n" +
		"**Граница:** без деталей.\n**Позже:** одно — X-2.1.1; два — X-3.1.1 и X-3.1.2; просто текст.\n"
	out := map[string]*Lesson{}
	parseFile(src, out)
	l := out["X-1.1.1"]
	if l == nil {
		t.Fatal("урок не найден")
	}
	if len(l.Qs) != 3 || l.Qs[0].Text != "Что такое `go`?" || l.Qs[0].Query != "what is go" || len(l.Qs[1].Refs) != 2 || l.Qs[2].Text != "Без запроса" {
		t.Fatalf("вопросы: %+v", l.Qs)
	}
	if len(l.Google) != 2 || len(l.Know) != 2 || len(l.Terms) != 2 || !l.Terms[0].New || l.Terms[1].New {
		t.Fatalf("разделы: %+v", l)
	}
	if l.Border != "без деталей." || len(l.Later) != 3 || len(l.Later[1].IDs) != 2 || l.Later[2].IDs != nil || l.Later[2].Text != "просто текст" {
		t.Fatalf("граница/позже: %q %+v", l.Border, l.Later)
	}
}
