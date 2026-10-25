package clip

import (
	"strings"
	"testing"

	"ascent/internal/plan"
)

func TestLessonExample(t *testing.T) {
	p, err := plan.LoadEmbedded()
	if err != nil {
		t.Fatal(err)
	}
	got, err := Lesson(p, "GO-7.3.4", LessonOpts{WithBrief: true})
	if err != nil {
		t.Fatal(err)
	}
	want := "Тема GO-7.3 append\n" +
		"> Функция append — главный источник багов со слайсами. Иногда она пишет в тот же массив, иногда переезжает в новый, и снаружи этого не видно. Здесь разбираем оба случая по шагам.\n" +
		"Урок GO-7.3.4 — Правило роста ёмкости ★★★\n" +
		"  ↳ граница: точная формула роста\n" +
		"  ↳ позже: округление до размерных классов — этап 3\n" +
		"  ↳ версия: правило поменялось в Go 1.18"
	if got != want {
		t.Fatalf("\n%q\n%q", got, want)
	}
}

func TestBriefOffAndDeps(t *testing.T) {
	p, _ := plan.LoadEmbedded()
	got, _ := Lesson(p, "GO-7.3.4", LessonOpts{WithDeps: true})
	if strings.Contains(got, "> ") || !strings.Contains(got, "Блок GO-7 стоит на:") {
		t.Fatal(got)
	}
}

func TestOthers(t *testing.T) {
	p, _ := plan.LoadEmbedded()
	c, _ := ThemeCheck(p, "GO-7.3")
	if !strings.HasPrefix(c, "Проверь меня по теме GO-7.3 append.") || !strings.Contains(c, "\n5. ") {
		t.Fatal(c)
	}
	m, _ := BlockMarkers(p, "GO-7")
	if !strings.HasPrefix(m, "Закрываю блок GO-7 ") || !strings.Contains(m, "\n1. ") {
		t.Fatal(m)
	}
	r := StageRun(p, 1)
	if !strings.HasPrefix(r, "ПРОГОН-1. ") || !strings.Contains(r, "Маркеры этапа:\n1. ") {
		t.Fatal(r[:80])
	}
	if DoneIDs(p, map[string]bool{"ФУНД-1.1.2": true, "ФУНД-1.1.1": true}) != "ФУНД-1.1.1, ФУНД-1.1.2" {
		t.Fatal("done ids")
	}
}
