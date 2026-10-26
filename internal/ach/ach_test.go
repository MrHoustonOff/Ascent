package ach

import (
	"strings"
	"testing"
	"time"

	"ascent/internal/plan"
	"ascent/internal/stats"
	"ascent/internal/store"
)

func TestCatalog(t *testing.T) {
	if n := len(Defs); n != 144 {
		t.Fatalf("достижений %d", n)
	}
	ids := map[string]bool{}
	for _, d := range Defs {
		if ids[d.ID] {
			t.Errorf("повтор %s", d.ID)
		}
		ids[d.ID] = true
		if d.Name == "" || d.Desc == "" || d.eval == nil || (d.Icon == "" && d.Mark == "") {
			t.Errorf("неполное: %s", d.ID)
		}
		if strings.Contains(strings.ReplaceAll(d.Name+d.Desc, "!=", ""), "!") {
			t.Errorf("восклицательный знак: %s", d.ID)
		}
		for _, w := range []string{"мин ", "минут", "часов"} {
			if strings.Contains(d.Desc, w) {
				t.Errorf("время в описании %s", d.ID)
			}
		}
	}
}

var msk = time.FixedZone("MSK", 3*3600)

// закрывает первые n тем плана по одной в день, начиная с start
func closeThemes(p *plan.Plan, n int, start time.Time, hour int) (map[string]store.Lesson, map[string]time.Time) {
	ls := map[string]store.Lesson{}
	ck := map[string]time.Time{}
	for _, id := range p.Order {
		ls[id] = store.Lesson{ID: id, Status: "todo"}
	}
	i := 0
	for _, s := range p.Stages {
		for _, b := range s.Blocks {
			for _, th := range b.Themes {
				if i >= n {
					return ls, ck
				}
				at := time.Date(start.Year(), start.Month(), start.Day()+i, hour, 0, 0, 0, msk).UTC()
				for _, l := range th.Lessons {
					ls[l.ID] = store.Lesson{ID: l.ID, Status: "done", DoneAt: at}
				}
				for _, c := range th.Checks {
					ck[store.CheckKey(th.ID, c)] = at
				}
				i++
			}
		}
	}
	return ls, ck
}

func TestEvaluate(t *testing.T) {
	p, _ := plan.LoadEmbedded()
	ls, ck := closeThemes(p, 11, time.Date(2026, 10, 1, 0, 0, 0, 0, msk), 23)
	in := &stats.Input{Plan: p, Lessons: ls, Checks: ck, Markers: map[string]time.Time{}, Rest: map[string]bool{}, Loc: msk,
		Now: time.Date(2026, 10, 25, 12, 0, 0, 0, msk), S: stats.Settings{DailyGoal: 2, DayStartHour: 4, MilestoneStage: 3}}
	got := map[string]bool{}
	for _, r := range Evaluate(in) {
		if r.Ok {
			got[r.ID] = true
		}
	}
	for _, id := range []string{"t1", "t3", "t5", "t10", "s2", "s3", "s5", "s7", "s10"} {
		if !got[id] {
			t.Errorf("нет %s", id)
		}
	}
	for _, id := range []string{"t15", "d2", "s14", "e1", "x_night", "x_early"} {
		if got[id] {
			t.Errorf("лишнее %s", id)
		}
	}
}

func TestNightOwlAndDay(t *testing.T) {
	p, _ := plan.LoadEmbedded()
	ls, ck := closeThemes(p, 1, time.Date(2026, 10, 1, 0, 0, 0, 0, msk), 2) // 02:00 МСК
	in := &stats.Input{Plan: p, Lessons: ls, Checks: ck, Markers: map[string]time.Time{}, Rest: map[string]bool{}, Loc: msk,
		Now: time.Date(2026, 10, 25, 12, 0, 0, 0, msk), S: stats.Settings{DailyGoal: 2, DayStartHour: 4, MilestoneStage: 3}}
	for _, r := range Evaluate(in) {
		if r.ID == "x_night" && !r.Ok {
			t.Error("сова не выдана")
		}
	}
}
