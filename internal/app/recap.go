package app

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"ascent/internal/ach"
	"ascent/internal/stats"
)

type RecapItem struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Sub   string `json:"sub"`
	// для тем: задачи (уроки) темы и вопросы «должен уметь ответить»
	Lessons []RecapItem `json:"lessons,omitempty"`
	Checks  int         `json:"checks,omitempty"`
	ChecksN int         `json:"checksN,omitempty"`
}

type RecapDay struct {
	Label  string `json:"label"`
	Themes int    `json:"themes"`
	Day    int    `json:"day"`    // число месяца
	Active bool   `json:"active"` // был учебный день
	Rest   bool   `json:"rest"`   // день отдыха
	Future bool   `json:"future"` // ещё не наступил
	Key    string `json:"key"`    // YYYY-MM-DD
}

type RecapDTO struct {
	Kind         string      `json:"kind"`
	Title        string      `json:"title"`
	Period       string      `json:"period"`
	Date         string      `json:"date"` // последний день периода (для «периода» — «до»)
	From         string      `json:"from"` // первый день периода
	RangeDays    int         `json:"rangeDays"`
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

	// для новых карточек
	Empty      bool            `json:"empty"`     // ни темы, ни урока, ни вопроса за период
	Heat       []stats.HeatDay `json:"heat"`      // хитмапа: недели до конца периода
	Tracks     []RecapTrack    `json:"tracks"`    // пройдено по трекам
	Prev       int             `json:"prev"`      // тем за прошлый такой же период; -1 — сравнивать не с чем
	PrevLabel  string          `json:"prevLabel"` // «прошлая неделя»
	Stages     []RecapStage    `json:"stages"`    // этапы для «горы прогресса»
	Forecast   []RecapForecast `json:"forecast"`  // веха и весь путь
	BestDay    *RecapBest      `json:"bestDay,omitempty"`
	BestWeek   *RecapBest      `json:"bestWeek,omitempty"`
	StagesDone int             `json:"stagesDone"`
	Nick       string          `json:"nick"`
	AchOpen    int             `json:"achOpen"`  // открыто достижений всего
	AchTotal   int             `json:"achTotal"` // всего достижений

	// «учу Go · день X»: X — учебный день от первой закрытой темы до конца периода (0 — тем ещё нет)
	DayN       int              `json:"dayN"`
	Start      string           `json:"start"`      // «5 сентября» — день первой темы
	BestStreak int              `json:"bestStreak"` // рекордная серия дней
	Milestones []RecapMilestone `json:"milestones"` // вехи пути (для «всего пути»)
}

type RecapMilestone struct {
	Date  string `json:"date"`  // «5 сен»
	Label string `json:"label"` // «Первая тема»
	Sub   string `json:"sub"`   // название темы, блока или этапа
}

type RecapTrack struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Done  int    `json:"done"`
	Total int    `json:"total"`
	Pct   int    `json:"pct"`
}

type RecapStage struct {
	Num   int    `json:"num"`
	Title string `json:"title"`
	Pct   int    `json:"pct"`
	Done  bool   `json:"done"`
}

type RecapForecast struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Days  int    `json:"days"`  // через сколько дней при нынешнем темпе; 0 — уже или неизвестно
	Text  string `json:"text"`  // «около 18 ноября», «уже закрыто»
	Ahead int    `json:"ahead"` // сколько тем осталось
}

type RecapBest struct {
	Label  string `json:"label"`
	Themes int    `json:"themes"`
}

// треки: префиксы блоков → подпись (порядок — как на картинке)
var recapTracks = []struct {
	Key, Label string
	Prefixes   []string
}{
	{"go", "Go", []string{"GO"}},
	{"fund", "Основы", []string{"ФУНД"}},
	{"db", "SQL и PostgreSQL", []string{"SQL", "PG"}},
	{"net", "Сеть и ОС", []string{"СЕТЬ", "ОС"}},
	{"arch", "Архитектура", []string{"АРХ", "СИСД", "ТЕСТ"}},
	{"infra", "Инфраструктура", []string{"ИНФРА", "БРОК"}},
}

// maxRangeDays — самый длинный произвольный период.
const maxRangeDays = 3 * 366

// parseRange разбирает «YYYY-MM-DD..YYYY-MM-DD»; даты можно перепутать местами.
func parseRange(s string) (from, to time.Time, ok bool) {
	a, b, found := strings.Cut(s, "..")
	if !found {
		return
	}
	f, err1 := time.Parse("2006-01-02", strings.TrimSpace(a))
	t, err2 := time.Parse("2006-01-02", strings.TrimSpace(b))
	if err1 != nil || err2 != nil {
		return
	}
	if t.Before(f) {
		f, t = t, f
	}
	if t.Sub(f) > maxRangeDays*24*time.Hour {
		f = t.AddDate(0, 0, -maxRangeDays)
	}
	return f, t, true
}

// Recap — итоги для инфографики. kind: day, week, month, all или range.
// date — YYYY-MM-DD (любой день недели для week); для range — «YYYY-MM-DD..YYYY-MM-DD», пусто — последние 14 дней.
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
	r := RecapDTO{Date: day.Format("2006-01-02"), Kind: kind, Themes: []RecapItem{}, Blocks: []RecapItem{}, Achievements: []AchRef{}, Days: []RecapDay{},
		Tracks: []RecapTrack{}, Stages: []RecapStage{}, Forecast: []RecapForecast{}, Milestones: []RecapMilestone{}, Prev: -1, Nick: s.set["nick"]}
	switch kind {
	case "week":
		from = stats.WeekStart(day)
		to = from.AddDate(0, 0, 6)
		r.Title = "Итоги недели"
		r.Period = fmt.Sprintf("%s — %s", dateGen(from), dateGen(to))
		r.PrevLabel = "прошлая неделя"
	case "month":
		from = time.Date(day.Year(), day.Month(), 1, 0, 0, 0, 0, day.Location())
		to = from.AddDate(0, 1, -1)
		r.Title = "Итоги месяца"
		r.Period = fmt.Sprintf("%s %d", monthsNom[from.Month()-1], from.Year())
		r.PrevLabel = "прошлый месяц"
	case "range":
		f, t, ok := parseRange(date)
		if !ok {
			t = s.today
			f = t.AddDate(0, 0, -13)
		}
		from, to = f, t
		r.Date = to.Format("2006-01-02")
		r.Title = "Итоги периода"
		r.Period = fmt.Sprintf("%s — %s", dateGen(from), dateGen(to))
		if from.Year() != to.Year() {
			r.Period = fmt.Sprintf("%s %d — %s %d", dateGen(from), from.Year(), dateGen(to), to.Year())
		}
		r.PrevLabel = "до этого"
	case "all":
		from = day
		if f, ok := s.in.FirstActive(); ok {
			from = stats.ParseDay(s.in.DayLabel(f))
		}
		to = day
		r.Title = "Весь путь"
		r.Period = fmt.Sprintf("%s — %s", dateGen(from), dateGen(to))
	default:
		r.Kind = "day"
		r.Title = "Итоги дня"
		r.PrevLabel = "вчера"
		r.Period = fmt.Sprintf("%s, %s", weekdaysNom[day.Weekday()], dateGen(day))
	}
	r.From = from.Format("2006-01-02")
	r.RangeDays = stats.DaysBetween(from, to) + 1
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
			x := RecapItem{ID: th.ID, Title: th.Title, Sub: th.Block, Lessons: []RecapItem{}, Checks: in.ChecksDone(th), ChecksN: len(th.Checks)}
			for _, l := range th.Lessons {
				x.Lessons = append(x.Lessons, RecapItem{ID: l.ID, Title: l.Title})
			}
			ths = append(ths, it{t, x})
		}
	}
	sort.Slice(ths, func(i, j int) bool { return ths[i].at.Before(ths[j].at) })
	for _, x := range ths {
		r.Themes = append(r.Themes, x.x)
	}
	for _, b := range a.plan.Blocks {
		if t, ok := in.BlockClosedAt(b); ok && !t.IsZero() && inRange(t) {
			r.Blocks = append(r.Blocks, RecapItem{ID: b.ID, Title: b.Title})
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
	r.AchTotal = len(ach.Defs)
	if have, err := a.st.Achievements(); err == nil {
		r.AchOpen = len(have)
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
		if kind != "all" && (kind != "range" || r.RangeDays <= 62) {
			k := d.Format("2006-01-02")
			r.Days = append(r.Days, RecapDay{Label: weekdaysShort[d.Weekday()], Themes: n, Day: d.Day(),
				Active: agg[k] != nil && agg[k].Active, Rest: in.Rest[k], Future: d.After(s.today), Key: k})
		}
	}
	r.Empty = len(r.Themes) == 0 && r.Lessons == 0 && r.Checks == 0
	a.recapExtras(s, &r, from, to)
	r.Streak = stats.CurrentStreak(in.ActiveDays(), in.Rest, s.today)
	r.BestStreak = stats.BestStreak(in.ActiveDays(), in.Rest)
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

// recapExtras — данные для карточек: хитмапа, треки, сравнение, этапы, прогноз, рекорды, день X.
func (a *App) recapExtras(s *snap, r *RecapDTO, from, to time.Time) {
	in := s.in
	a.recapJourney(s, r, to)
	// хитмапа: целые недели, от 5 до 26 штук, заканчивая неделей конца периода
	end := stats.WeekStart(to).AddDate(0, 0, 6)
	weeks := 5
	switch r.Kind {
	case "month":
		weeks = int(end.Sub(stats.WeekStart(from)).Hours()/24/7) + 1
	case "all", "range":
		weeks = int(end.Sub(stats.WeekStart(from)).Hours()/24/7) + 1
		if weeks > 26 {
			weeks = 26
		}
	}
	if weeks < 5 {
		weeks = 5
	}
	start := end.AddDate(0, 0, -7*weeks+1)
	r.Heat = in.Heat(start.Format("2006-01-02"), end.Format("2006-01-02"))

	// треки по пройденным урокам
	for _, t := range recapTracks {
		tr := RecapTrack{Key: t.Key, Label: t.Label}
		for _, id := range a.plan.Order {
			l := a.plan.Lessons[id]
			if l == nil || l.Block == "" {
				continue
			}
			for _, p := range t.Prefixes {
				if strings.HasPrefix(l.Block, p+"-") {
					tr.Total++
					if s.status(id) == "done" {
						tr.Done++
					}
				}
			}
		}
		tr.Pct = pct(tr.Done, tr.Total)
		r.Tracks = append(r.Tracks, tr)
	}

	// сравнение с прошлым таким же периодом
	if r.Kind != "all" {
		pf, pt := from.AddDate(0, 0, -1), from.AddDate(0, 0, -1)
		switch r.Kind {
		case "week":
			pf = from.AddDate(0, 0, -7)
			pt = from.AddDate(0, 0, -1)
		case "month":
			pf = from.AddDate(0, -1, 0)
			pt = from.AddDate(0, 0, -1)
		case "range": // столько же дней перед периодом
			pf = from.AddDate(0, 0, -r.RangeDays)
			pt = from.AddDate(0, 0, -1)
		}
		n := 0
		for _, th := range a.plan.Themes {
			if t, ok := in.ThemeClosedAt(th); ok {
				d := stats.ParseDay(in.DayLabel(t))
				if !d.Before(pf) && !d.After(pt) {
					n++
				}
			}
		}
		r.Prev = n
	}

	// этапы
	for _, st := range a.plan.Stages {
		done, total := 0, 0
		for _, b := range st.Blocks {
			d, t := s.blockCounts(b)
			done += d
			total += t
		}
		closed := in.StageClosed(st)
		if closed {
			r.StagesDone++
		}
		r.Stages = append(r.Stages, RecapStage{Num: st.Num, Title: st.Title, Pct: pct(done, total), Done: closed})
	}

	// прогноз
	for _, f := range in.Forecasts() {
		if f.Key != "milestone" && f.Key != "path" {
			continue
		}
		label := "До вехи «можно на собесы»"
		if f.Key == "path" {
			label = "До конца пути"
		}
		r.Forecast = append(r.Forecast, RecapForecast{Key: f.Key, Label: label, Days: f.Days, Text: s.forecastDate(f), Ahead: f.Ahead})
	}

	// рекорды периода: лучший день и лучшая неделя
	if r.Kind == "month" || r.Kind == "all" || (r.Kind == "range" && r.RangeDays >= 7) {
		agg := in.Aggregates()
		weekSum := map[string]int{}
		for d := from; !d.After(to); d = d.AddDate(0, 0, 1) {
			x := agg[d.Format("2006-01-02")]
			if x == nil || x.Themes == 0 {
				continue
			}
			if r.BestDay == nil || x.Themes > r.BestDay.Themes {
				r.BestDay = &RecapBest{Label: dateGen(d), Themes: x.Themes}
			}
			weekSum[stats.WeekStart(d).Format("2006-01-02")] += x.Themes
		}
		for k, v := range weekSum {
			if r.BestWeek == nil || v > r.BestWeek.Themes {
				ws := stats.ParseDay(k)
				r.BestWeek = &RecapBest{Label: fmt.Sprintf("%s — %s", dateShort(ws), dateShort(ws.AddDate(0, 0, 6))), Themes: v}
			}
		}
	}
}

// recapJourney — день X от первой закрытой темы и вехи пути до конца периода.
func (a *App) recapJourney(s *snap, r *RecapDTO, to time.Time) {
	in := s.in
	end := to
	if end.After(s.today) {
		end = s.today
	}
	type closed struct {
		at    time.Time
		title string
	}
	var ths []closed
	for _, th := range a.plan.Themes {
		if t, ok := in.ThemeClosedAt(th); ok && !stats.ParseDay(in.DayLabel(t)).After(end) {
			ths = append(ths, closed{t, th.Title})
		}
	}
	if len(ths) == 0 {
		return
	}
	sort.Slice(ths, func(i, j int) bool { return ths[i].at.Before(ths[j].at) })
	first := stats.ParseDay(in.DayLabel(ths[0].at))
	r.DayN = stats.DaysBetween(first, end) + 1
	r.Start = dateGen(first)
	if r.Kind != "all" {
		return
	}
	type ms struct {
		at time.Time
		m  RecapMilestone
	}
	day := func(t time.Time) string { return dateShort(stats.ParseDay(in.DayLabel(t))) }
	list := []ms{{ths[0].at, RecapMilestone{day(ths[0].at), "Первая тема", ths[0].title}}}
	for _, n := range []int{10, 25, 50, 100, 150, 200, 300, 400, 500} {
		if len(ths) >= n {
			list = append(list, ms{ths[n-1].at, RecapMilestone{day(ths[n-1].at), fmt.Sprintf("%d %s", n, plural(n, "тема", "темы", "тем")), ths[n-1].title}})
		}
	}
	var fb *ms
	for _, b := range a.plan.Blocks {
		if t, ok := in.BlockClosedAt(b); ok && !t.IsZero() && !stats.ParseDay(in.DayLabel(t)).After(end) && (fb == nil || t.Before(fb.at)) {
			fb = &ms{t, RecapMilestone{day(t), "Первый блок", b.Title}}
		}
	}
	if fb != nil {
		list = append(list, *fb)
	}
	for _, st := range a.plan.Stages {
		if t, ok := in.StageClosedAt(st); ok && !t.IsZero() && !stats.ParseDay(in.DayLabel(t)).After(end) {
			list = append(list, ms{t, RecapMilestone{day(t), fmt.Sprintf("Этап %d", st.Num), st.Title}})
		}
	}
	sort.SliceStable(list, func(i, j int) bool { return list[i].at.Before(list[j].at) })
	for _, x := range list {
		r.Milestones = append(r.Milestones, x.m)
	}
}

// recapFolder — имя подпапки экспорта: «Итоги дня 26.10.26», «Итоги недели 20.10–26.10.26».
func recapFolder(kind string, day time.Time) string {
	d := func(t time.Time) string { return t.Format("02.01.06") }
	switch kind {
	case "week":
		f := stats.WeekStart(day)
		return fmt.Sprintf("Итоги недели %s–%s", f.Format("02.01"), d(f.AddDate(0, 0, 6)))
	case "month":
		return "Итоги месяца " + day.Format("01.06")
	case "all":
		return "Весь путь " + d(day)
	}
	return "Итоги дня " + d(day)
}

// rangeFolder — «Итоги 01.10–26.10.26»; годы разные — «Итоги 20.12.25–10.01.26».
func rangeFolder(from, to time.Time) string {
	if from.Year() != to.Year() {
		return fmt.Sprintf("Итоги %s–%s", from.Format("02.01.06"), to.Format("02.01.06"))
	}
	return fmt.Sprintf("Итоги %s–%s", from.Format("02.01"), to.Format("02.01.06"))
}

// SaveImages сохраняет PNG (data URL или base64) в подпапку экспорта внутри запомненной папки.
// Папка спрашивается один раз (или когда её больше нет) и хранится в настройке export_dir.
// names — имена файлов без расширения, по одному на картинку. Возвращает путь подпапки.
func (a *App) SaveImages(kind, date string, names, images []string) (string, error) {
	a.mu.Lock()
	set, _ := a.st.Settings()
	a.mu.Unlock()
	root := set["export_dir"]
	if st, err := os.Stat(root); root == "" || err != nil || !st.IsDir() {
		var err error
		if root, err = a.pickExportDir(); err != nil || root == "" {
			return "", err
		}
	}
	day := a.Now().In(a.Loc)
	if t, err := time.Parse("2006-01-02", date); err == nil {
		day = t
	}
	name := recapFolder(kind, day)
	if f, t, ok := parseRange(date); kind == "range" && ok {
		name = rangeFolder(f, t)
	}
	dir := filepath.Join(root, name)
	for i := 2; ; i++ { // повторный экспорт за тот же период не затирает прежний
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			break
		}
		dir = filepath.Join(root, fmt.Sprintf("%s (%d)", name, i))
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, writeImages(dir, names, images)
}

// ChangeExportDir — выбрать другую папку для экспорта.
func (a *App) ChangeExportDir() (string, error) { return a.pickExportDir() }

func (a *App) pickExportDir() (string, error) {
	if a.host == nil {
		return "", fmt.Errorf("диалог недоступен")
	}
	dir, err := a.host.PickDir("Папка для итогов")
	if err != nil || dir == "" {
		return "", err
	}
	a.mu.Lock()
	defer a.mu.Unlock()
	return dir, a.st.SetSetting("export_dir", dir)
}
