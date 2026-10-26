package app

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"ascent/internal/stats"
)

type DotDTO struct {
	Label string `json:"label"`
	State string `json:"state"` // done | rest | today | empty | future
	Day   string `json:"day"`
	Count int    `json:"count"`
}

type StreakDTO struct {
	N        int      `json:"n"`
	Unit     string   `json:"unit"`
	Best     int      `json:"best"`
	Week     []DotDTO `json:"week"`
	CanRest  bool     `json:"canRest"`
	RestUsed bool     `json:"restUsed"`
}

type RingDTO struct {
	Pct        int    `json:"pct"`
	Done       int    `json:"done"`
	Total      int    `json:"total"`
	StageNum   int    `json:"stageNum"`
	StageTitle string `json:"stageTitle"`
	Block      string `json:"block"`
}

type ForecastRow struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Text  string `json:"text"`
}

type ForecastBrief struct {
	Empty bool          `json:"empty"`
	Pace  string        `json:"pace"`
	Rows  []ForecastRow `json:"rows"`
	Fork  string        `json:"fork"`
	Young string        `json:"young"`
}

type TodayDTO struct {
	Eyebrow   string        `json:"eyebrow"`
	Greeting  string        `json:"greeting"`
	Status    string        `json:"status"`
	Motd      string        `json:"motd"`
	DoneToday int           `json:"doneToday"`
	Fresh     bool          `json:"fresh"`
	Streak    StreakDTO     `json:"streak"`
	Ring      RingDTO       `json:"ring"`
	Forecast  ForecastBrief `json:"forecast"`
	Recent    []RecentDTO   `json:"recent"`
}

type RecentDTO struct {
	Kind  string `json:"kind"` // theme | block | stage
	ID    string `json:"id"`
	Title string `json:"title"`
	When  string `json:"when"`
}

func (s *snap) dayLabel(t time.Time) string { return dateGen(t) }

func (s *snap) streak() StreakDTO {
	days := s.in.ActiveDays()
	agg := s.in.Aggregates()
	d := StreakDTO{N: stats.CurrentStreak(days, s.in.Rest, s.today), Best: stats.BestStreak(days, s.in.Rest), Week: []DotDTO{}}
	ws := stats.WeekStart(s.today)
	for i := 0; i < 7; i++ {
		t := ws.AddDate(0, 0, i)
		k := t.Format("2006-01-02")
		dot := DotDTO{Label: weekdaysShort[(i+1)%7], Day: k, State: "empty"}
		if a := agg[k]; a != nil {
			dot.Count = a.Themes
		}
		switch {
		case days[k]:
			dot.State = "done"
		case s.in.Rest[k]:
			dot.State = "rest"
		case t.After(s.today):
			dot.State = "future"
		}
		if t.Equal(s.today) && dot.State == "empty" {
			dot.State = "today"
		}
		d.Week = append(d.Week, dot)
	}
	d.Unit = plural(d.N, "день подряд", "дня подряд", "дней подряд")
	d.CanRest = stats.CanRest(days, s.in.Rest, s.today, s.in.S.RestPerWeek)
	d.RestUsed = !d.CanRest && !days[s.today.Format("2006-01-02")] && !s.in.Rest[s.today.Format("2006-01-02")]
	return d
}

func (s *snap) forecastDate(f stats.Forecast) string {
	if f.Ahead == 0 {
		return "уже закрыто"
	}
	if f.Date == "" {
		return ""
	}
	return "около " + dateGen(stats.ParseDay(f.Date))
}

func (s *snap) forecastBrief() ForecastBrief {
	v, vmin, vmax, young := s.in.Rate()
	b := ForecastBrief{Rows: []ForecastRow{}}
	if v == 0 {
		b.Empty = true
		return b
	}
	b.Pace = fmt.Sprintf("Темп: %s %s в день за 14 дней", num(v), paceUnit(v))
	fs := s.in.Forecasts()
	for _, f := range fs {
		var label string
		switch f.Key {
		case "block":
			label = "Блок " + strings.TrimPrefix(f.Label, "Блок ")
		case "stage":
			label = f.Label
		case "milestone":
			label = "Веха"
		default:
			continue
		}
		b.Rows = append(b.Rows, ForecastRow{Key: f.Key, Label: label, Text: s.forecastDate(f)})
	}
	if young {
		first, _ := s.in.FirstActive()
		_ = first
		b.Young = fmt.Sprintf("Прогноз уточнится через %s.", days(7-s.in.HistoryDays()))
	} else if vmin != vmax {
		for _, f := range fs {
			if f.Key == "milestone" && f.From != "" {
				b.Fork = fmt.Sprintf("Если темп будет от %s до %s — между %s и %s.", num(vmin), num(vmax),
					dateGen(stats.ParseDay(f.From)), dateGen(stats.ParseDay(f.To)))
			}
		}
	}
	return b
}

func (a *App) Today() (TodayDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return TodayDTO{}, err
	}
	t := TodayDTO{}
	local := s.now.In(a.Loc)
	// «дата» — учебный день, чтобы после полуночи не прыгало
	t.Eyebrow = fmt.Sprintf("%s, %s", weekdaysNom[s.today.Weekday()], dateGen(s.today))
	t.Greeting = greeting(local.Hour())
	t.DoneToday = s.themesToday()
	done, total := s.totalCounts()
	t.Fresh = done == 0 && len(s.in.ActiveDays()) == 0
	switch {
	case t.Fresh:
		t.Status = "Начните с первого урока. Остальное придёт само."
	case t.DoneToday > 0:
		t.Status = fmt.Sprintf("Сегодня %s %s.", plural(t.DoneToday, "закрыта", "закрыто", "закрыто"), themes(t.DoneToday))
	default:
		t.Status = "Сегодня пока без закрытых тем. Один урок — уже движение."

	}
	t.Motd = s.motd()
	t.Streak = s.streak()
	t.Ring = RingDTO{Pct: pct(done, total), Done: done, Total: total}
	if n := s.in.NextLesson(); n != nil {
		t.Ring.StageNum, t.Ring.Block = n.Stage, n.Block
		if st := a.stageByNum(n.Stage); st != nil {
			t.Ring.StageTitle = st.Title
		}
	}
	t.Forecast = s.forecastBrief()
	t.Recent = s.recent(5)
	return t, nil
}

// ---------- хитмапа ----------

type HeatDTO struct {
	Day     string `json:"day"`
	Day0    int    `json:"dom"`     // число месяца
	Weekday int    `json:"weekday"` // 0 = понедельник
	Month   int    `json:"month"`   // 0..11
	Themes  int    `json:"themes"`
	Rest    bool   `json:"rest"`
	Level   int    `json:"level"`
	Today   bool   `json:"today"`
	Future  bool   `json:"future"`
	Text    string `json:"text"`
}

func (a *App) Heat(from, to string) ([]HeatDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return nil, err
	}
	out := []HeatDTO{}
	for _, h := range s.in.Heat(from, to) {
		t := stats.ParseDay(h.Day)
		d := HeatDTO{Day: h.Day, Day0: t.Day(), Weekday: (int(t.Weekday()) + 6) % 7, Month: int(t.Month()) - 1,
			Themes: h.Themes, Rest: h.Rest, Level: h.Level, Today: t.Equal(s.today), Future: t.After(s.today)}
		txt := dateGen(t)
		switch {
		case h.Rest:
			txt += " · день отдыха"
		case h.Themes > 0:
			txt += " · " + themes(h.Themes)
		case h.Active:
			txt += " · учёба без закрытой темы"
		case d.Future:
		default:
			txt += " · тем нет"
		}
		d.Text = txt
		out = append(out, d)
	}
	return out, nil
}

// ---------- скорость ----------

type PaceDTO struct {
	N      int    `json:"n"`
	Value  string `json:"value"`
	Themes int    `json:"themes"`
}

type VelocityDTO struct {
	Paces      []PaceDTO `json:"paces"`
	PerWeek    string    `json:"perWeek"`
	AllTime    string    `json:"allTime"`
	ActiveDays int       `json:"activeDays28"`
	BestStreak int       `json:"bestStreak"`
	BestDay    string    `json:"bestDay"`
	BestDayN   int       `json:"bestDayThemes"`
	WeekThemes int       `json:"weekThemes"`
	WeekDelta  string    `json:"weekDelta"`
	Empty      bool      `json:"empty"`
}

func (a *App) Velocity() (VelocityDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return VelocityDTO{}, err
	}
	v := VelocityDTO{Paces: []PaceDTO{}}
	for _, n := range []int{7, 14, 28} {
		w := s.in.Pace(n)
		v.Paces = append(v.Paces, PaceDTO{N: n, Value: num(w.V), Themes: w.Themes})
	}
	v14 := s.in.Pace(14).V
	v.PerWeek = num(v14 * 7)
	v.AllTime = num(s.in.AllTimePace())
	days := s.in.ActiveDays()
	agg := s.in.Aggregates()
	for i := 0; i < 28; i++ {
		if days[s.today.AddDate(0, 0, -i).Format("2006-01-02")] {
			v.ActiveDays++
		}
	}
	v.BestStreak = stats.BestStreak(days, s.in.Rest)
	for k, d := range agg {
		if d.Themes > v.BestDayN || (d.Themes == v.BestDayN && d.Themes > 0 && k > v.BestDay) {
			v.BestDayN, v.BestDay = d.Themes, k
		}
	}
	if v.BestDay != "" {
		v.BestDay = dateGen(stats.ParseDay(v.BestDay))
	}
	sum := func(from, n int) int {
		t := 0
		for i := from; i < from+n; i++ {
			if d := agg[s.today.AddDate(0, 0, -i).Format("2006-01-02")]; d != nil {
				t += d.Themes
			}
		}
		return t
	}
	v.WeekThemes = sum(0, 7)
	switch diff := v.WeekThemes - sum(7, 7); {
	case diff > 0:
		v.WeekDelta = fmt.Sprintf("+%d", diff)
	case diff == 0:
		v.WeekDelta = "столько же"
	default:
		v.WeekDelta = "—"
	}
	v.Empty = len(days) == 0
	return v, nil
}

type ForecastDTO struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Ahead string `json:"ahead"`
	Date  string `json:"date"`
	Fork  string `json:"fork"`
}

type ForecastFull struct {
	Rows   []ForecastDTO `json:"rows"`
	Pace   string        `json:"pace"`
	Young  string        `json:"young"`
	Empty  bool          `json:"empty"`
	Target string        `json:"target"`
	Need   string        `json:"need"`
	Now    string        `json:"now"`
	NeedN  int           `json:"needN"`
}

func (a *App) Forecast() (ForecastFull, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return ForecastFull{}, err
	}
	v, _, _, young := s.in.Rate()
	r := ForecastFull{Rows: []ForecastDTO{}, Empty: v == 0, Target: s.set["milestone_target"]}
	r.Pace = num(v)
	for _, f := range s.in.Forecasts() {
		d := ForecastDTO{Key: f.Key, Label: f.Label, Ahead: themes(f.Ahead), Date: s.forecastDate(f)}
		if f.From != "" {
			d.Fork = dateShort(stats.ParseDay(f.From)) + " — " + dateShort(stats.ParseDay(f.To))
		}
		r.Rows = append(r.Rows, d)
	}
	if young && v > 0 {
		r.Young = fmt.Sprintf("Прогноз уточнится через %s.", days(7-s.in.HistoryDays()))
	}
	return r, nil
}

type DailyDTO struct {
	Day   string  `json:"day"`
	Label string  `json:"label"`
	Count int     `json:"themes"`
	Avg7  float64 `json:"avg7"`
	Today bool    `json:"today"`
}

// Daily — закрытые темы по дням и скользящее среднее за 7 дней.
func (a *App) Daily(n int) ([]DailyDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return nil, err
	}
	agg := s.in.Aggregates()
	get := func(t time.Time) int {
		if d := agg[t.Format("2006-01-02")]; d != nil {
			return d.Themes
		}
		return 0
	}
	out := []DailyDTO{}
	for i := n - 1; i >= 0; i-- {
		t := s.today.AddDate(0, 0, -i)
		sum := 0
		for j := 0; j < 7; j++ {
			sum += get(t.AddDate(0, 0, -j))
		}
		out = append(out, DailyDTO{Day: t.Format("2006-01-02"), Label: dateShort(t), Count: get(t), Avg7: float64(sum) / 7, Today: i == 0})
	}
	return out, nil
}

type WeeklyDTO struct {
	Start   string `json:"start"`
	Label   string `json:"label"`
	Count   int    `json:"themes"`
	Current bool   `json:"current"`
}

// Weekly — закрытые темы по календарным неделям (с понедельника).
func (a *App) Weekly(n int) ([]WeeklyDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return nil, err
	}
	agg := s.in.Aggregates()
	ws := stats.WeekStart(s.today)
	out := []WeeklyDTO{}
	for i := n - 1; i >= 0; i-- {
		start := ws.AddDate(0, 0, -7*i)
		c := 0
		for j := 0; j < 7; j++ {
			if d := agg[start.AddDate(0, 0, j).Format("2006-01-02")]; d != nil {
				c += d.Themes
			}
		}
		out = append(out, WeeklyDTO{Start: start.Format("2006-01-02"), Label: dateShort(start), Count: c, Current: i == 0})
	}
	return out, nil
}

// paceUnit — «тема/темы/тем» для дробного и целого темпа (1,5 темы; 2 темы; 5 тем).
func paceUnit(v float64) string {
	if v != float64(int(v)) {
		return "темы"
	}
	return plural(int(v), "тема", "темы", "тем")
}

// recent — недавно закрытые темы, блоки и этапы (с датой закрытия).
func (s *snap) recent(n int) []RecentDTO {
	type item struct {
		at time.Time
		d  RecentDTO
	}
	var xs []item
	p := s.a.plan
	for _, th := range p.Themes {
		if t, ok := s.in.ThemeClosedAt(th); ok {
			xs = append(xs, item{t, RecentDTO{"theme", th.ID, th.Title, s.dayText(t)}})
		}
	}
	for _, b := range p.Blocks {
		if len(b.Themes) == 0 {
			continue
		}
		if t, ok := s.in.BlockClosedAt(b); ok && !t.IsZero() {
			xs = append(xs, item{t.Add(time.Second), RecentDTO{"block", b.ID, b.Title, s.dayText(t)}})
		}
	}
	for _, st := range p.Stages {
		if t, ok := s.in.StageClosedAt(st); ok && !t.IsZero() {
			xs = append(xs, item{t.Add(2 * time.Second), RecentDTO{"stage", "stage-" + strconv.Itoa(st.Num), "Этап " + strconv.Itoa(st.Num), s.dayText(t)}})
		}
	}
	sort.Slice(xs, func(i, j int) bool { return xs[i].at.After(xs[j].at) })
	out := []RecentDTO{}
	for i := 0; i < len(xs) && i < n; i++ {
		out = append(out, xs[i].d)
	}
	return out
}
