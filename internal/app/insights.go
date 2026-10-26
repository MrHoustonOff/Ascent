package app

import (
	"time"

	"ascent/internal/stats"
)

type WeekdayDTO struct {
	Label string  `json:"label"`
	Avg   float64 `json:"avg"`
	AvgS  string  `json:"avgText"`
	Total int     `json:"total"`
	Best  bool    `json:"best"`
}

type PartDTO struct {
	Label string `json:"label"`
	Hint  string `json:"hint"`
	Count int    `json:"count"`
	Pct   int    `json:"pct"`
	Best  bool   `json:"best"`
}

type InsightsDTO struct {
	Empty        bool         `json:"empty"`
	Weekdays     []WeekdayDTO `json:"weekdays"`
	BestWeekday  string       `json:"bestWeekday"`
	Parts        []PartDTO    `json:"parts"`
	AvgActive    string       `json:"avgActive"`
	AvgDay       string       `json:"avgDay"`
	ThemesTotal  int          `json:"themesTotal"`
	LessonsTotal int          `json:"lessonsTotal"`
	ChecksTotal  int          `json:"checksTotal"`
	BlocksTotal  int          `json:"blocksTotal"`
	ActiveTotal  int          `json:"activeTotal"`
	BestWeek     int          `json:"bestWeek"`
	BestWeekAt   string       `json:"bestWeekAt"`
	BestMonth    int          `json:"bestMonth"`
	BestMonthAt  string       `json:"bestMonthAt"`
	Trend        string       `json:"trend"`
}

// Insights — подробная статистика: средние по дням недели, время суток, рекорды. Всё в темах.
func (a *App) Insights() (InsightsDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return InsightsDTO{}, err
	}
	in := s.in
	r := InsightsDTO{Weekdays: []WeekdayDTO{}, Parts: []PartDTO{}}
	agg := in.Aggregates()
	first, ok := in.FirstActive()
	if !ok {
		r.Empty = true
		return r, nil
	}
	// по дням недели: среднее = темы в этот день недели / сколько таких дней прошло с начала
	var sum, cnt [7]int
	for d := first; !d.After(s.today); d = d.AddDate(0, 0, 1) {
		wd := (int(d.Weekday()) + 6) % 7
		cnt[wd]++
		if x := agg[d.Format("2006-01-02")]; x != nil {
			sum[wd] += x.Themes
		}
	}
	names := []string{"Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"}
	full := []string{"понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"}
	best := -1
	for i := 0; i < 7; i++ {
		w := WeekdayDTO{Label: names[i], Total: sum[i]}
		if cnt[i] > 0 {
			w.Avg = float64(sum[i]) / float64(cnt[i])
		}
		w.AvgS = num(w.Avg)
		r.Weekdays = append(r.Weekdays, w)
		if sum[i] > 0 && (best < 0 || w.Avg > r.Weekdays[best].Avg) {
			best = i
		}
	}
	if best >= 0 {
		r.Weekdays[best].Best = true
		r.BestWeekday = full[best]
	}
	// время суток закрытия тем
	parts := []PartDTO{{Label: "Утро", Hint: "5–12"}, {Label: "День", Hint: "12–18"}, {Label: "Вечер", Hint: "18–23"}, {Label: "Ночь", Hint: "23–5"}}
	total := 0
	var weeks = map[string]int{}
	var months = map[string]int{}
	for _, th := range a.plan.Themes {
		t, ok := in.ThemeClosedAt(th)
		if !ok {
			continue
		}
		total++
		h := t.In(a.Loc).Hour()
		switch {
		case h >= 5 && h < 12:
			parts[0].Count++
		case h >= 12 && h < 18:
			parts[1].Count++
		case h >= 18 && h < 23:
			parts[2].Count++
		default:
			parts[3].Count++
		}
		day := stats.ParseDay(in.DayLabel(t))
		weeks[stats.WeekStart(day).Format("2006-01-02")]++
		months[day.Format("2006-01")]++
	}
	bp := 0
	for i := range parts {
		if total > 0 {
			parts[i].Pct = parts[i].Count * 100 / total
		}
		if parts[i].Count > parts[bp].Count {
			bp = i
		}
	}
	if total > 0 {
		parts[bp].Best = true
	}
	r.Parts = parts
	for k, v := range weeks {
		if v > r.BestWeek || (v == r.BestWeek && k > r.BestWeekAt) {
			r.BestWeek, r.BestWeekAt = v, k
		}
	}
	if r.BestWeekAt != "" {
		r.BestWeekAt = "неделя с " + dateGen(stats.ParseDay(r.BestWeekAt))
	}
	for k, v := range months {
		if v > r.BestMonth || (v == r.BestMonth && k > r.BestMonthAt) {
			r.BestMonth, r.BestMonthAt = v, k
		}
	}
	if r.BestMonthAt != "" {
		t, _ := time.Parse("2006-01", r.BestMonthAt)
		r.BestMonthAt = monthsNom[t.Month()-1] + " " + t.Format("2006")
	}
	// итоги
	activeWithTheme := 0
	for k, d := range agg {
		_ = k
		if d.Active {
			r.ActiveTotal++
		}
		if d.Themes > 0 {
			activeWithTheme++
		}
	}
	r.ThemesTotal = total
	if activeWithTheme > 0 {
		r.AvgActive = num(float64(total) / float64(activeWithTheme))
	} else {
		r.AvgActive = "0"
	}
	r.AvgDay = num(in.AllTimePace())
	for _, l := range in.Lessons {
		if l.Status == "done" && !l.Imported {
			r.LessonsTotal++
		}
	}
	r.ChecksTotal = len(in.Checks)
	for _, b := range a.plan.Blocks {
		if t, ok := in.BlockClosedAt(b); ok && !t.IsZero() && len(b.Themes) > 0 {
			r.BlocksTotal++
		}
	}
	v7, v28 := in.Pace(7).V, in.Pace(28).V
	switch {
	case in.HistoryDays() < 14:
		r.Trend = "Темп пока складывается."
	case v7 > v28*1.15:
		r.Trend = "Последняя неделя быстрее обычного."
	case v7 < v28*0.85:
		r.Trend = "Последняя неделя спокойнее обычного. Это нормально."
	default:
		r.Trend = "Темп ровный."
	}
	return r, nil
}
