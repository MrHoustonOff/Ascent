package app

import (
	"fmt"
	"math"
	"time"

	"ascent/internal/stats"
)

// Скорость: никаких норм и целей. Средняя скорость считается сама, по ней — прогноз.
// Если указана желаемая дата, мягко подсказываем, какая скорость к ней приведёт.

type SpeedPoint struct {
	Day   string  `json:"day"`
	Label string  `json:"label"`
	V     float64 `json:"v"`
}

type TargetDTO struct {
	Set       bool    `json:"set"`
	Date      string  `json:"date"`
	DateText  string  `json:"dateText"`
	Scope     string  `json:"scope"` // milestone | path
	Label     string  `json:"label"`
	Ahead     string  `json:"ahead"`
	DaysLeft  string  `json:"daysLeft"`
	Need      float64 `json:"need"`
	NeedText  string  `json:"needText"`
	NeedWeek  string  `json:"needWeek"`
	Now       float64 `json:"now"`
	Status    string  `json:"status"` // ok | close | faster | passed | done
	Verdict   string  `json:"verdict"`
	Projected string  `json:"projected"`
}

type SpeedDTO struct {
	Empty     bool          `json:"empty"`
	Young     string        `json:"young"`
	V         float64       `json:"v"`
	VText     string        `json:"vText"`
	Unit      string        `json:"unit"`
	PerWeek   string        `json:"perWeek"`
	V7        string        `json:"v7"`
	V28       string        `json:"v28"`
	All       string        `json:"all"`
	Trend     string        `json:"trend"` // up | flat | down
	TrendText string        `json:"trendText"`
	Headline  string        `json:"headline"` // «Собесы — около 18 ноября»
	Fork      string        `json:"fork"`
	Series    []SpeedPoint  `json:"series"`
	Rows      []ForecastDTO `json:"rows"`
	Target    TargetDTO     `json:"target"`
}

func (a *App) Speed() (SpeedDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return SpeedDTO{}, err
	}
	in := s.in
	v, vmin, vmax, young := in.Rate()
	d := SpeedDTO{Series: []SpeedPoint{}, Rows: []ForecastDTO{}, V: v, VText: num(v), Unit: paceUnit(v) + " в день"}
	d.Empty = v == 0 && in.HistoryDays() == 0
	d.PerWeek = num(v * 7)
	d.V7, d.V28, d.All = num(in.Pace(7).V), num(in.Pace(28).V), num(in.AllTimePace())
	if young && !d.Empty {
		d.Young = fmt.Sprintf("Истории пока мало — скорость уточнится через %s.", days(7-in.HistoryDays()))
	}
	v7, v28 := in.Pace(7).V, in.Pace(28).V
	switch {
	case in.HistoryDays() < 14:
		d.Trend, d.TrendText = "flat", "Скорость складывается"
	case v7 > v28*1.12:
		d.Trend, d.TrendText = "up", "Последняя неделя быстрее обычного"
	case v7 < v28*0.88:
		d.Trend, d.TrendText = "down", "Последняя неделя спокойнее — это нормально"
	default:
		d.Trend, d.TrendText = "flat", "Скорость ровная"
	}
	// скользящая средняя за 7 дней на 12 недель
	agg := in.Aggregates()
	first, hasFirst := in.FirstActive()
	for i := 83; i >= 0; i-- {
		t := s.today.AddDate(0, 0, -i)
		if hasFirst && t.Before(first) {
			continue
		}
		sum, n := 0, 0
		for j := 0; j < 7; j++ {
			x := t.AddDate(0, 0, -j)
			if hasFirst && x.Before(first) {
				break
			}
			n++
			if a := agg[x.Format("2006-01-02")]; a != nil {
				sum += a.Themes
			}
		}
		val := 0.0
		if n > 0 {
			val = float64(sum) / float64(n)
		}
		d.Series = append(d.Series, SpeedPoint{t.Format("2006-01-02"), dateShort(t), math.Round(val*100) / 100})
	}
	// прогноз
	var milestoneDate string
	for _, f := range in.Forecasts() {
		r := ForecastDTO{Key: f.Key, Label: f.Label, Ahead: themes(f.Ahead), Date: s.forecastDate(f)}
		if f.From != "" {
			r.Fork = dateShort(stats.ParseDay(f.From)) + " — " + dateShort(stats.ParseDay(f.To))
		}
		d.Rows = append(d.Rows, r)
		if f.Key == "milestone" {
			milestoneDate = r.Date
			if f.From != "" && vmin != vmax {
				d.Fork = fmt.Sprintf("Если скорость будет от %s до %s — между %s и %s.", num(vmin), num(vmax),
					dateGen(stats.ParseDay(f.From)), dateGen(stats.ParseDay(f.To)))
			}
		}
	}
	switch {
	case milestoneDate == "уже закрыто":
		d.Headline = "Веха «можно на собесы» уже пройдена"
	case milestoneDate != "":
		d.Headline = "Собесы — " + milestoneDate
	default:
		d.Headline = "Прогноз появится после первой закрытой темы"
	}
	d.Target = s.target(v)
	return d, nil
}

// target — мягкая рекомендация к желаемой дате. Это не норма: просто арифметика.
func (s *snap) target(v float64) TargetDTO {
	t := TargetDTO{Scope: s.set["target_scope"], Now: v}
	if t.Scope != "path" {
		t.Scope = "milestone"
	}
	t.Label = map[string]string{"milestone": "веха «можно на собесы»", "path": "весь путь"}[t.Scope]
	date := s.set["milestone_target"]
	tt, err := time.Parse("2006-01-02", date)
	if date == "" || err != nil {
		return t
	}
	t.Set, t.Date, t.DateText = true, date, dateGen(tt)
	ahead, proj := 0, false
	for _, x := range s.in.Targets() {
		if x.Key == t.Scope {
			ahead, proj = x.Ahead, x.HasProject
		}
	}
	t.Ahead = themes(ahead)
	left := stats.DaysBetween(s.today, tt)
	if ahead == 0 {
		t.Status, t.Verdict = "done", "Уже пройдено. Дата больше не нужна."
		return t
	}
	if proj {
		left -= s.in.S.ProjectDays
	}
	if left < 1 {
		t.Status = "passed"
		t.Verdict = "Эта дата уже прошла или слишком близко. Выберите новую — прогноз подскажет, что реально."
		return t
	}
	t.DaysLeft = days(left)
	t.Need = math.Round(float64(ahead)/float64(left)*10) / 10
	if t.Need < 0.1 {
		t.Need = 0.1
	}
	t.NeedText = num(t.Need)
	t.NeedWeek = num(math.Round(t.Need*7*10) / 10)
	if v > 0 {
		dd := stats.DaysFor(ahead, v, proj, s.in.S.ProjectDays)
		t.Projected = dateGen(s.today.AddDate(0, 0, dd))
	}
	switch {
	case v >= t.Need*1.05:
		t.Status = "ok"
		t.Verdict = fmt.Sprintf("Нынешней скорости хватает с запасом: при ней %s будет около %s. Ускоряться не нужно.", t.Label, t.Projected)
	case v >= t.Need*0.9:
		t.Status = "close"
		t.Verdict = fmt.Sprintf("Вы идёте почти точно в срок. Около %s %s в день — и дата сходится.", t.NeedText, paceUnit(t.Need))
	default:
		t.Status = "faster"
		if v > 0 {
			t.Verdict = fmt.Sprintf("Чтобы успеть, понадобится около %s %s в день — сейчас %s. Можно чуть прибавить или спокойно сдвинуть дату: при нынешней скорости — около %s.",
				t.NeedText, paceUnit(t.Need), num(v), t.Projected)
		} else {
			t.Verdict = fmt.Sprintf("Чтобы успеть, понадобится около %s %s в день.", t.NeedText, paceUnit(t.Need))
		}
	}
	return t
}
