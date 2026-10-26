package app

import (
	"sort"
	"time"

	"ascent/internal/ach"
)

// AchDTO — достижение для экрана. У закрытых name/desc пустые: секрет не утекает через API.
type AchDTO struct {
	ID       string `json:"id"`
	Icon     string `json:"icon"`
	Tier     string `json:"tier"`
	Unlocked bool   `json:"unlocked"`
	Name     string `json:"name"`
	Desc     string `json:"desc"`
	When     string `json:"when"`
	New      bool   `json:"new"`
	order    time.Time
}

type AchListDTO struct {
	Items    []AchDTO `json:"items"`
	Unlocked int      `json:"unlocked"`
	Total    int      `json:"total"`
	New      int      `json:"new"`
}

type AchRef struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Desc string `json:"desc"`
}

// syncAch записывает в БД все выполненные достижения; возвращает только что открытые.
func (a *App) syncAch(s *snap) []AchRef {
	have, err := a.st.Achievements()
	if err != nil {
		return nil
	}
	var fresh []AchRef
	for _, r := range ach.Evaluate(s.in) {
		if !r.Ok {
			continue
		}
		if _, ok := have[r.ID]; ok {
			continue
		}
		if err := a.st.UnlockAchievement(r.ID, r.At, false); err == nil {
			fresh = append(fresh, AchRef{r.ID, r.Name, r.Desc})
		}
	}
	return fresh
}

func (a *App) achCounts() (unlocked, total int) {
	m, _ := a.st.Achievements()
	return len(m), len(ach.Defs)
}

// Achievements — все достижения: открытые с названием и описанием, закрытые — секретные.
func (a *App) Achievements() (AchListDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return AchListDTO{}, err
	}
	a.syncAch(s) // тихо: достижения, открытые до этого визита, не требуют тоста
	have, err := a.st.Achievements()
	if err != nil {
		return AchListDTO{}, err
	}
	out := AchListDTO{Items: []AchDTO{}, Total: len(ach.Defs)}
	for _, d := range ach.Defs {
		x := AchDTO{ID: d.ID, Icon: d.Icon, Tier: d.Tier}
		if row, ok := have[d.ID]; ok {
			x.Unlocked, x.Name, x.Desc, x.New = true, d.Name, d.Desc, !row.Seen
			x.order = row.At
			if row.At.IsZero() {
				x.When = "ранее"
			} else {
				x.When = s.dayText(row.At)
			}
			out.Unlocked++
			if x.New {
				out.New++
			}
		}
		out.Items = append(out.Items, x)
	}
	// открытые — по дате (свежие выше), секретные — в порядке каталога
	sort.SliceStable(out.Items, func(i, j int) bool {
		a, b := out.Items[i], out.Items[j]
		if a.Unlocked != b.Unlocked {
			return a.Unlocked
		}
		if a.Unlocked {
			return a.order.After(b.order)
		}
		return false
	})
	return out, nil
}

// MarkAchievementsSeen снимает отметку «новое» при выходе с экрана достижений.
func (a *App) MarkAchievementsSeen() error {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.st.MarkAchievementsSeen()
}
