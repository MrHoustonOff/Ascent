package app

import (
	"fmt"
	"sort"
	"time"

	"ascent/internal/ach"
	"ascent/internal/stats"
)

type RecapItem struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Sub   string `json:"sub"`
}

type RecapDay struct {
	Label  string `json:"label"`
	Themes int    `json:"themes"`
}

type RecapDTO struct {
	Kind         string      `json:"kind"`
	Title        string      `json:"title"`
	Period       string      `json:"period"`
	Themes       []RecapItem `json:"themes"`
	Blocks       []RecapItem `json:"blocks"`
	Achievements []AchRef    `json:"achievements"`
	Lessons      int         `json:"lessons"`
	Checks       int         `json:"checks"`
	Days         []RecapDay  `json:"days"`
	ActiveDays   int         `json:"activeDays"`
	Streak       int         `json:"streak"`
	Pct          int         `json:"pct"`
	Done         int         `json:"done"`
	Total        int         `json:"total"`
	Pace         string      `json:"pace"`
	Stage        string      `json:"stage"`
}

// Recap — итоги дня или недели для инфографики. date — YYYY-MM-DD (любой день недели для kind=week).
func (a *App) Recap(kind, date string) (RecapDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return RecapDTO{}, err
	}
	day := s.today
	if t, err := time.Parse("2006-01-02", date); err == nil {
		day = t
	}
	from, to := day, day
	r := RecapDTO{Kind: kind, Themes: []RecapItem{}, Blocks: []RecapItem{}, Achievements: []AchRef{}, Days: []RecapDay{}}
	if kind == "week" {
		from = stats.WeekStart(day)
		to = from.AddDate(0, 0, 6)
		r.Title = "Итоги недели"
		r.Period = fmt.Sprintf("%s — %s", dateGen(from), dateGen(to))
	} else {
		r.Kind = "day"
		r.Title = "Итоги дня"
		r.Period = fmt.Sprintf("%s, %s", weekdaysNom[day.Weekday()], dateGen(day))
	}
	in := s.in
	inRange := func(t time.Time) bool {
		d := stats.ParseDay(in.DayLabel(t))
		return !d.Before(from) && !d.After(to)
	}
	type it struct {
		at time.Time
		x  RecapItem
	}
	var ths []it
	for _, th := range a.plan.Themes {
		if t, ok := in.ThemeClosedAt(th); ok && inRange(t) {
			ths = append(ths, it{t, RecapItem{th.ID, th.Title, th.Block}})
		}
	}
	sort.Slice(ths, func(i, j int) bool { return ths[i].at.Before(ths[j].at) })
	for _, x := range ths {
		r.Themes = append(r.Themes, x.x)
	}
	for _, b := range a.plan.Blocks {
		if t, ok := in.BlockClosedAt(b); ok && !t.IsZero() && inRange(t) {
			r.Blocks = append(r.Blocks, RecapItem{b.ID, b.Title, ""})
		}
	}
	for _, l := range in.Lessons {
		if l.Status == "done" && !l.Imported && l.HasDone() && inRange(l.DoneAt) {
			r.Lessons++
		}
	}
	for _, t := range in.Checks {
		if inRange(t) {
			r.Checks++
		}
	}
	if have, err := a.st.Achievements(); err == nil {
		for _, d := range ach.Defs {
			if row, ok := have[d.ID]; ok && !row.At.IsZero() && inRange(row.At) {
				r.Achievements = append(r.Achievements, AchRef{ID: d.ID, Icon: d.Icon, Tier: d.Tier, Group: d.Group, Mark: d.Mark, Sub: d.Sub, Name: d.Name, Desc: d.Desc})
			}
		}
	}
	agg := in.Aggregates()
	for d := from; !d.After(to); d = d.AddDate(0, 0, 1) {
		n := 0
		if x := agg[d.Format("2006-01-02")]; x != nil {
			n = x.Themes
			if x.Active {
				r.ActiveDays++
			}
		}
		r.Days = append(r.Days, RecapDay{weekdaysShort[d.Weekday()], n})
	}
	r.Streak = stats.CurrentStreak(in.ActiveDays(), in.Rest, s.today)
	r.Done, r.Total = s.totalCounts()
	r.Pct = pct(r.Done, r.Total)
	r.Pace = num(in.Pace(14).V)
	if n := in.NextLesson(); n != nil {
		if st := a.stageByNum(n.Stage); st != nil {
			r.Stage = fmt.Sprintf("Этап %d · %s", st.Num, st.Title)
		}
	}
	return r, nil
}

// SaveImages сохраняет PNG (data URL или base64) в выбранную папку. Возвращает папку.
func (a *App) SaveImages(name string, images []string) (string, error) {
	if a.host == nil {
		return "", fmt.Errorf("диалог недоступен")
	}
	dir, err := a.host.PickDir("Куда сохранить картинки")
	if err != nil || dir == "" {
		return "", err
	}
	return dir, writeImages(dir, name, images)
}
