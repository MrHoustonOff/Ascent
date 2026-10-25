package stats

import (
	"ascent/internal/plan"
	"ascent/internal/store"
)

// themeImported — все уроки темы отмечены массово.
func (in *Input) themeImported(th *plan.Theme) bool {
	if len(th.Lessons) == 0 {
		return false
	}
	for _, l := range th.Lessons {
		r := in.Lessons[l.ID]
		if r.Status != "done" || !r.Imported {
			return false
		}
	}
	return true
}

// LessonsDone — все ли уроки темы пройдены.
func (in *Input) LessonsDone(th *plan.Theme) bool {
	for _, l := range th.Lessons {
		if in.Lessons[l.ID].Status != "done" {
			return false
		}
	}
	return true
}

// ChecksDone — число отмеченных вопросов темы.
func (in *Input) ChecksDone(th *plan.Theme) int {
	n := 0
	for _, c := range th.Checks {
		if _, ok := in.Checks[store.CheckKey(th.ID, c)]; ok {
			n++
		}
	}
	return n
}

// ThemeClosed — тема закрыта (8.3).
func (in *Input) ThemeClosed(th *plan.Theme) bool {
	if !in.LessonsDone(th) {
		return false
	}
	return in.themeImported(th) || in.ChecksDone(th) == len(th.Checks)
}

// MarkersDone — число отмеченных маркеров ◆ блока.
func (in *Input) MarkersDone(b *plan.Block) (done, total int) {
	for _, q := range in.Plan.Markers(b.ID) {
		total++
		if _, ok := in.Markers[MarkerKey(b.ID, q)]; ok {
			done++
		}
	}
	return
}

func MarkerKey(block string, q *plan.BankQ) string { return store.CheckKey(block, q.Text) }

// BlockClosed — блок закрыт: все темы закрыты и все ◆ отмечены. Прогон — когда урок done.
func (in *Input) BlockClosed(b *plan.Block) bool {
	if b.Run != nil && len(b.Themes) == 0 {
		return in.Lessons[b.Run.ID].Status == "done"
	}
	imported := true
	for _, th := range b.Themes {
		if !in.ThemeClosed(th) {
			return false
		}
		if !in.themeImported(th) {
			imported = false
		}
	}
	if imported {
		return true
	}
	d, t := in.MarkersDone(b)
	return d == t
}

// StageClosed — все блоки этапа закрыты.
func (in *Input) StageClosed(s *plan.Stage) bool {
	for _, b := range s.Blocks {
		if !in.BlockClosed(b) {
			return false
		}
	}
	return true
}
