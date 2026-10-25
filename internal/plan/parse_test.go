package plan

import (
	"testing"
)

func load(t *testing.T) *Plan {
	t.Helper()
	p, err := LoadEmbedded()
	if err != nil {
		t.Fatal(err)
	}
	return p
}

func TestControlNumbers(t *testing.T) {
	p := load(t)
	eq := func(name string, got, want int) {
		t.Helper()
		if got != want {
			t.Errorf("%s: %d, ожидалось %d", name, got, want)
		}
	}
	eq("этапов", len(p.Stages), 7)
	eq("блоков", len(p.Blocks), 61)
	eq("тем", len(p.Themes), 180)
	eq("уроков", len(p.Order), 932)
	want := []int{163, 208, 171, 126, 84, 124, 56}
	for i, s := range p.Stages {
		n := 0
		for _, id := range p.Order {
			if p.Lessons[id].Stage == s.Num {
				n++
			}
		}
		eq("уроков этапа "+s.Title, n, want[i])
	}
	checks := 0
	for _, th := range p.Themes {
		checks += len(th.Checks)
		if len(th.Checks) < 2 {
			t.Errorf("у темы %s вопросов %d", th.ID, len(th.Checks))
		}
	}
	eq("вопросов самопроверки", checks, 720)
	eq("банк", len(p.Bank), 419)
	m := 0
	for _, q := range p.Bank {
		if q.Marker {
			m++
		}
	}
	eq("маркеров", m, 141)
	eq("терминов", len(p.Terms), 351)

	stars := [4]int{}
	for _, id := range p.Order {
		l := p.Lessons[id]
		if l.Kind == "run" {
			continue
		}
		stars[l.Stars]++
	}
	if stars != [4]int{107, 80, 523, 215} {
		t.Errorf("звёзды: %v", stars)
	}
}

func TestSpecifics(t *testing.T) {
	p := load(t)
	if p.Order[0] != "ФУНД-1.1.1" || p.Order[len(p.Order)-1] != "ПРОГОН-7" {
		t.Fatalf("порядок: %s … %s", p.Order[0], p.Order[len(p.Order)-1])
	}
	l := p.Lessons["GO-7.3.4"]
	if l == nil || len(l.Arrows) != 3 || l.Arrows[0].Kind != "граница" {
		t.Fatalf("GO-7.3.4: %+v", l)
	}
	th := p.Themes["GO-7.3"]
	if th == nil || len(th.Brief) == 0 || len(th.Checks) != 5 {
		t.Fatalf("GO-7.3: %+v", th)
	}
	for _, s := range p.Stages {
		for _, b := range s.Blocks {
			for _, d := range b.Deps {
				if p.Blocks[d] == nil && p.Themes[d] == nil && p.Lessons[d] == nil {
					t.Errorf("стоит на %s в %s не найден", d, b.ID)
				}
			}
		}
	}
	for _, id := range p.Order {
		for _, a := range p.Lessons[id].Arrows {
			for _, d := range a.IDs {
				if p.Lessons[d] == nil && p.Themes[d] == nil && p.Blocks[d] == nil {
					t.Errorf("стрелка %s: ID %s не найден", id, d)
				}
			}
		}
	}
	for _, q := range p.Bank {
		if p.Blocks[q.Block] == nil {
			t.Errorf("банк: блок %s", q.Block)
		}
		for _, id := range q.Lessons {
			if p.Lessons[id] == nil && p.Themes[id] == nil && p.Blocks[id] == nil {
				t.Errorf("банк: ID %s не найден", id)
			}
		}
	}
	if p.Lessons["СБОР-1.2.1"].Kind != "project" {
		t.Error("проект не найден")
	}
	if len(p.Sources) < 10 {
		t.Errorf("источников %d", len(p.Sources))
	}
	for _, k := range []string{"00", "98", "99"} {
		if p.Docs[k] == "" {
			t.Errorf("документ %s пуст", k)
		}
	}
}
