// Package ach — секретные достижения. Все они привязаны к закрытым темам:
// считаются от момента закрытия тем, блоков и этапов. Урок времени не имеет.
package ach

import (
	"sort"
	"strings"
	"time"

	"ascent/internal/plan"
	"ascent/internal/stats"
)

// Def — описание достижения. Name и Desc видны только после открытия.
type Def struct {
	ID    string
	Name  string
	Desc  string
	Icon  string // ключ иконки на фронтенде
	Tier  string // accent | streak | success
	Group string
	Sub   string // подпись над надписью (ID блока)
	Mark  string // короткая надпись на значке: число, ID блока или кусочек кода
	eval  func(*ctx) (time.Time, bool)
}

type closure struct {
	th  *plan.Theme
	at  time.Time
	day string
}

type ctx struct {
	in       *stats.Input
	closures []closure // по времени закрытия
	byDay    map[string][]closure
	days     []string // дни с закрытыми темами, по возрастанию
	blocks   []time.Time
	stages   map[int]time.Time
}

func build(in *stats.Input) *ctx {
	c := &ctx{in: in, byDay: map[string][]closure{}, stages: map[int]time.Time{}}
	for _, th := range in.Plan.Themes {
		if at, ok := in.ThemeClosedAt(th); ok {
			cl := closure{th, at, in.DayLabel(at)}
			c.closures = append(c.closures, cl)
		}
	}
	sort.Slice(c.closures, func(i, j int) bool { return c.closures[i].at.Before(c.closures[j].at) })
	for _, cl := range c.closures {
		if _, ok := c.byDay[cl.day]; !ok {
			c.days = append(c.days, cl.day)
		}
		c.byDay[cl.day] = append(c.byDay[cl.day], cl)
	}
	for _, b := range in.Plan.Blocks {
		if len(b.Themes) == 0 {
			continue
		}
		if at, ok := in.BlockClosedAt(b); ok && !at.IsZero() {
			c.blocks = append(c.blocks, at)
		}
	}
	sort.Slice(c.blocks, func(i, j int) bool { return c.blocks[i].Before(c.blocks[j]) })
	for _, st := range in.Plan.Stages {
		if at, ok := in.StageClosedAt(st); ok && !at.IsZero() {
			c.stages[st.Num] = at
		}
	}
	return c
}

// ---------- правила ----------

func countThemes(n int) func(*ctx) (time.Time, bool) {
	return func(c *ctx) (time.Time, bool) {
		if len(c.closures) >= n {
			return c.closures[n-1].at, true
		}
		return time.Time{}, false
	}
}

func perDay(n int) func(*ctx) (time.Time, bool) {
	return func(c *ctx) (time.Time, bool) {
		var best time.Time
		for _, d := range c.days {
			if xs := c.byDay[d]; len(xs) >= n {
				if best.IsZero() || xs[n-1].at.Before(best) {
					best = xs[n-1].at
				}
			}
		}
		return best, !best.IsZero()
	}
}

func perWeek(n int) func(*ctx) (time.Time, bool) {
	return func(c *ctx) (time.Time, bool) {
		cnt := map[string]int{}
		var best time.Time
		for _, cl := range c.closures {
			ws := stats.WeekStart(stats.ParseDay(cl.day)).Format("2006-01-02")
			cnt[ws]++
			if cnt[ws] == n && (best.IsZero() || cl.at.Before(best)) {
				best = cl.at
			}
		}
		return best, !best.IsZero()
	}
}

// streak: подряд идущие дни с закрытой темой; день отдыха серию не рвёт.
func streak(n int) func(*ctx) (time.Time, bool) {
	return func(c *ctx) (time.Time, bool) {
		cur := 0
		var prev time.Time
		for _, d := range c.days {
			t := stats.ParseDay(d)
			if cur == 0 {
				cur = 1
			} else {
				ok := true
				for x := prev.AddDate(0, 0, 1); x.Before(t); x = x.AddDate(0, 0, 1) {
					if !c.in.Rest[x.Format("2006-01-02")] {
						ok = false
						break
					}
				}
				if ok {
					cur++
				} else {
					cur = 1
				}
			}
			prev = t
			if cur >= n {
				xs := c.byDay[d]
				return xs[len(xs)-1].at, true
			}
		}
		return time.Time{}, false
	}
}

func blocksClosed(n int) func(*ctx) (time.Time, bool) {
	return func(c *ctx) (time.Time, bool) {
		if len(c.blocks) >= n {
			return c.blocks[n-1], true
		}
		return time.Time{}, false
	}
}

func stageClosed(num int) func(*ctx) (time.Time, bool) {
	return func(c *ctx) (time.Time, bool) { t, ok := c.stages[num]; return t, ok }
}

func firstOfTrack(track string) func(*ctx) (time.Time, bool) {
	return func(c *ctx) (time.Time, bool) {
		for _, cl := range c.closures {
			if strings.HasPrefix(cl.th.ID, track+"-") {
				return cl.at, true
			}
		}
		return time.Time{}, false
	}
}

func firstWhere(pred func(*ctx, closure) bool) func(*ctx) (time.Time, bool) {
	return func(c *ctx) (time.Time, bool) {
		for _, cl := range c.closures {
			if pred(c, cl) {
				return cl.at, true
			}
		}
		return time.Time{}, false
	}
}

func hourOf(c *ctx, t time.Time) int { return t.In(c.in.Loc).Hour() }

func weekend(c *ctx) (time.Time, bool) {
	var best time.Time
	for _, d := range c.days {
		t := stats.ParseDay(d)
		if t.Weekday() != time.Sunday {
			continue
		}
		sat := t.AddDate(0, 0, -1).Format("2006-01-02")
		if len(c.byDay[sat]) > 0 {
			xs := c.byDay[d]
			if at := xs[0].at; best.IsZero() || at.Before(best) {
				best = at
			}
		}
	}
	return best, !best.IsZero()
}

// comeback: тема закрыта после паузы от трёх дней без закрытых тем (дни отдыха не считаются паузой).
func comeback(c *ctx) (time.Time, bool) {
	for i := 1; i < len(c.days); i++ {
		a, b := stats.ParseDay(c.days[i-1]), stats.ParseDay(c.days[i])
		gap := 0
		for x := a.AddDate(0, 0, 1); x.Before(b); x = x.AddDate(0, 0, 1) {
			if !c.in.Rest[x.Format("2006-01-02")] {
				gap++
			}
		}
		if gap >= 3 {
			return c.byDay[c.days[i]][0].at, true
		}
	}
	return time.Time{}, false
}

func milestone(c *ctx) (time.Time, bool) {
	ms := c.in.S.MilestoneStage
	if ms < 1 {
		ms = 3
	}
	var best time.Time
	for n := 1; n <= ms; n++ {
		t, ok := c.stages[n]
		if !ok {
			return time.Time{}, false
		}
		if t.After(best) {
			best = t
		}
	}
	return best, true
}

func blockID(id string) func(*ctx) (time.Time, bool) {
	return func(c *ctx) (time.Time, bool) {
		b := c.in.Plan.Blocks[id]
		if b == nil {
			return time.Time{}, false
		}
		t, ok := c.in.BlockClosedAt(b)
		return t, ok && !t.IsZero()
	}
}

// trackDone: закрыты все темы трека.
func trackDone(track string) func(*ctx) (time.Time, bool) {
	return func(c *ctx) (time.Time, bool) {
		var last time.Time
		n := 0
		for _, th := range c.in.Plan.Themes {
			if !strings.HasPrefix(th.ID, track+"-") {
				continue
			}
			n++
			t, ok := c.in.ThemeClosedAt(th)
			if !ok {
				return time.Time{}, false
			}
			if t.After(last) {
				last = t
			}
		}
		return last, n > 0
	}
}

func perMonth(n int) func(*ctx) (time.Time, bool) {
	return func(c *ctx) (time.Time, bool) {
		cnt := map[string]int{}
		var best time.Time
		for _, cl := range c.closures {
			m := cl.day[:7]
			cnt[m]++
			if cnt[m] == n && (best.IsZero() || cl.at.Before(best)) {
				best = cl.at
			}
		}
		return best, !best.IsZero()
	}
}

// allWeekdays: темы закрывались в каждый из семи дней недели (в любые недели).
func allWeekdays(c *ctx) (time.Time, bool) {
	seen := map[time.Weekday]bool{}
	for _, cl := range c.closures {
		seen[stats.ParseDay(cl.day).Weekday()] = true
		if len(seen) == 7 {
			return cl.at, true
		}
	}
	return time.Time{}, false
}

// ---------- каталог ----------

var Defs = []Def{
	// сколько тем закрыто
	{ID: "t1", Group: "themes", Icon: "gopher", Tier: "accent", Name: "Первый шаг", Desc: "Закрыта первая тема: уроки пройдены, вопросы отвечены. Дальше проще.", eval: countThemes(1)},
	{ID: "t3", Group: "themes", Icon: "spark", Tier: "accent", Name: "Втянулись", Desc: "Три закрытые темы. Это уже не проба, а начало привычки.", eval: countThemes(3)},
	{ID: "t5", Group: "themes", Icon: "star", Tier: "accent", Name: "Пятёрка", Desc: "Пять тем позади.", eval: countThemes(5)},
	{ID: "t10", Group: "themes", Icon: "star", Tier: "accent", Name: "Десяток", Desc: "Десять закрытых тем. Самое время оглянуться и увидеть, сколько уже пройдено.", eval: countThemes(10)},
	{ID: "t15", Group: "themes", Icon: "layers", Tier: "accent", Name: "Полтора десятка", Desc: "Пятнадцать тем. Темп набран.", eval: countThemes(15)},
	{ID: "t25", Group: "themes", Icon: "layers", Tier: "accent", Name: "Четверть сотни", Desc: "Двадцать пять тем закрыто.", eval: countThemes(25)},
	{ID: "t40", Group: "themes", Icon: "bolt", Tier: "accent", Name: "Не случайность", Desc: "Сорок тем. Так выглядит система, а не порыв.", eval: countThemes(40)},
	{ID: "t60", Group: "themes", Icon: "bolt", Tier: "accent", Name: "Треть пути", Desc: "Шестьдесят тем: ровно треть всех тем курса.", eval: countThemes(60)},
	{ID: "t80", Group: "themes", Icon: "compass", Tier: "accent", Name: "За серединой не за горами", Desc: "Восемьдесят закрытых тем. Середина уже видна.", eval: countThemes(80)},
	{ID: "t100", Group: "themes", Icon: "crown", Tier: "accent", Name: "Сотня", Desc: "Сто тем закрыто. Больше половины пути.", eval: countThemes(100)},
	{ID: "t130", Group: "themes", Icon: "crown", Tier: "accent", Name: "Дальше, чем казалось", Desc: "Сто тридцать тем. Когда-то это число выглядело недостижимым.", eval: countThemes(130)},
	{ID: "t160", Group: "themes", Icon: "flag", Tier: "accent", Name: "Почти всё", Desc: "Сто шестьдесят тем. До конца остались считаные.", eval: countThemes(160)},
	{ID: "t180", Group: "themes", Icon: "gopher", Tier: "accent", Name: "Каждая тема", Desc: "Закрыта каждая тема курса. Вы прошли весь путь.", eval: countThemes(180)},

	// несколько тем за день
	{ID: "d2", Group: "day", Icon: "twin", Tier: "streak", Name: "Дубль", Desc: "Две темы закрыты за один учебный день.", eval: perDay(2)},
	{ID: "d3", Group: "day", Icon: "twin", Tier: "streak", Name: "Хет-трик", Desc: "Три темы за один день.", eval: perDay(3)},
	{ID: "d4", Group: "day", Icon: "bolt", Tier: "streak", Name: "Рабочий день", Desc: "Четыре темы за день. Не каждый день так, и это нормально.", eval: perDay(4)},
	{ID: "d5", Group: "day", Icon: "rocket", Tier: "streak", Name: "Спринт", Desc: "Пять тем за один день. Завтра можно отдохнуть.", eval: perDay(5)},

	// дни подряд с закрытой темой
	{ID: "s2", Group: "streak", Icon: "flame", Tier: "streak", Name: "Два дня подряд", Desc: "Тема закрывалась два дня подряд.", eval: streak(2)},
	{ID: "s3", Group: "streak", Icon: "flame", Tier: "streak", Name: "Трёхдневка", Desc: "Три дня подряд с закрытой темой.", eval: streak(3)},
	{ID: "s5", Group: "streak", Icon: "flame", Tier: "streak", Name: "Рабочая неделя", Desc: "Пять дней подряд, по теме в день.", eval: streak(5)},
	{ID: "s7", Group: "streak", Icon: "calendar", Tier: "streak", Name: "Целая неделя", Desc: "Семь дней подряд. День отдыха серию не рвёт.", eval: streak(7)},
	{ID: "s10", Group: "streak", Icon: "calendar", Tier: "streak", Name: "Десять дней", Desc: "Десять дней подряд с закрытой темой.", eval: streak(10)},
	{ID: "s14", Group: "streak", Icon: "calendar", Tier: "streak", Name: "Две недели", Desc: "Четырнадцать дней подряд. Ритм стал частью жизни.", eval: streak(14)},
	{ID: "s21", Group: "streak", Icon: "sun", Tier: "streak", Name: "Три недели", Desc: "Двадцать один день подряд. Говорят, примерно столько формируется привычка.", eval: streak(21)},
	{ID: "s30", Group: "streak", Icon: "sun", Tier: "streak", Name: "Месяц", Desc: "Тридцать дней подряд. Это серьёзно.", eval: streak(30)},

	// за неделю
	{ID: "w5", Group: "week", Icon: "wave", Tier: "accent", Name: "Хорошая неделя", Desc: "Пять тем закрыто за одну календарную неделю.", eval: perWeek(5)},
	{ID: "w10", Group: "week", Icon: "wave", Tier: "accent", Name: "Сильная неделя", Desc: "Десять тем за календарную неделю.", eval: perWeek(10)},
	{ID: "w15", Group: "week", Icon: "wave", Tier: "accent", Name: "Неделя-рекордистка", Desc: "Пятнадцать тем за одну неделю. Редкий темп.", eval: perWeek(15)},

	// блоки
	{ID: "b1", Group: "blocks", Icon: "block", Tier: "success", Name: "Блок закрыт", Desc: "Закрыт первый блок: все темы пройдены и все маркеры ◆ отвечены.", eval: blocksClosed(1)},
	{ID: "b5", Group: "blocks", Icon: "block", Tier: "success", Name: "Пять блоков", Desc: "Пять закрытых блоков.", eval: blocksClosed(5)},
	{ID: "b10", Group: "blocks", Icon: "block", Tier: "success", Name: "Десять блоков", Desc: "Десять блоков позади.", eval: blocksClosed(10)},
	{ID: "b20", Group: "blocks", Icon: "grid", Tier: "success", Name: "Двадцать блоков", Desc: "Двадцать блоков закрыто.", eval: blocksClosed(20)},
	{ID: "b35", Group: "blocks", Icon: "grid", Tier: "success", Name: "Тридцать пять блоков", Desc: "Больше половины блоков курса закрыто.", eval: blocksClosed(35)},
	{ID: "b54", Group: "blocks", Icon: "grid", Tier: "success", Name: "Все блоки", Desc: "Закрыт каждый блок курса.", eval: blocksClosed(54)},

	// этапы
	{ID: "e1", Group: "stages", Icon: "stage1", Tier: "success", Name: "Фундамент", Desc: "Закрыт этап 1. Машина, память и первые программы на Go позади.", eval: stageClosed(1)},
	{ID: "e2", Group: "stages", Icon: "stage2", Tier: "success", Name: "Данные в руках", Desc: "Закрыт этап 2. Слайсы, map, структуры и интерфейсы больше не загадка.", eval: stageClosed(2)},
	{ID: "e3", Group: "stages", Icon: "stage3", Tier: "success", Name: "Параллельный мир", Desc: "Закрыт этап 3. Горутины, каналы и рантайм освоены.", eval: stageClosed(3)},
	{ID: "e4", Group: "stages", Icon: "stage4", Tier: "success", Name: "На связи", Desc: "Закрыт этап 4. Сеть и веб: от пакета до HTTP-сервера.", eval: stageClosed(4)},
	{ID: "e5", Group: "stages", Icon: "stage5", Tier: "success", Name: "Сервис целиком", Desc: "Закрыт этап 5. Сервис собран от базы до тестов.", eval: stageClosed(5)},
	{ID: "e6", Group: "stages", Icon: "stage6", Tier: "success", Name: "Сообщения доставлены", Desc: "Закрыт этап 6. Брокеры, эксплуатация и мониторинг пройдены.", eval: stageClosed(6)},
	{ID: "e7", Group: "stages", Icon: "stage7", Tier: "success", Name: "Финишная прямая", Desc: "Закрыт этап 7. Весь основной путь пройден.", eval: stageClosed(7)},

	// первая тема трека
	{ID: "k_sql", Group: "tracks", Icon: "db", Tier: "accent", Name: "Первый запрос", Desc: "Закрыта первая тема по SQL.", eval: firstOfTrack("SQL")},
	{ID: "k_pg", Group: "tracks", Icon: "db", Tier: "accent", Name: "Под капотом Postgres", Desc: "Закрыта первая тема про устройство Postgres.", eval: firstOfTrack("PG")},
	{ID: "k_net", Group: "tracks", Icon: "net", Tier: "accent", Name: "Первый пакет", Desc: "Закрыта первая сетевая тема.", eval: firstOfTrack("СЕТЬ")},
	{ID: "k_os", Group: "tracks", Icon: "term", Tier: "accent", Name: "Командная строка", Desc: "Закрыта первая тема про Linux.", eval: firstOfTrack("ОС")},
	{ID: "k_arch", Group: "tracks", Icon: "layers", Tier: "accent", Name: "Чертёж", Desc: "Закрыта первая архитектурная тема.", eval: firstOfTrack("АРХ")},
	{ID: "k_test", Group: "tracks", Icon: "check", Tier: "accent", Name: "Зелёные тесты", Desc: "Закрыта первая тема про тестирование.", eval: firstOfTrack("ТЕСТ")},
	{ID: "k_infra", Group: "tracks", Icon: "box", Tier: "accent", Name: "Контейнер", Desc: "Закрыта первая инфраструктурная тема: Docker, кэш или наблюдаемость.", eval: firstOfTrack("ИНФРА")},
	{ID: "k_brok", Group: "tracks", Icon: "queue", Tier: "accent", Name: "Очередь", Desc: "Закрыта первая тема про брокеры сообщений.", eval: firstOfTrack("БРОК")},
	{ID: "k_sysd", Group: "tracks", Icon: "compass", Tier: "accent", Name: "Системный взгляд", Desc: "Закрыта первая тема по системному дизайну.", eval: firstOfTrack("СИСД")},

	// особые
	{ID: "x_long", Group: "special", Icon: "chat", Tier: "streak", Name: "Длинный разговор", Desc: "Закрыта тема, в которой семь и больше вопросов самопроверки.", eval: firstWhere(func(c *ctx, cl closure) bool { return len(cl.th.Checks) >= 7 })},
	{ID: "x_night", Group: "special", Icon: "moon", Tier: "streak", Name: "Сова", Desc: "Тема закрыта после полуночи. Учебный день у вас начинается позже, и это учтено.", eval: firstWhere(func(c *ctx, cl closure) bool {
		h := hourOf(c, cl.at)
		return h >= 0 && h < c.in.S.DayStartHour && c.in.S.DayStartHour > 0
	})},
	{ID: "x_early", Group: "special", Icon: "sunrise", Tier: "streak", Name: "Жаворонок", Desc: "Тема закрыта утром, между пятью и девятью часами.", eval: firstWhere(func(c *ctx, cl closure) bool { h := hourOf(c, cl.at); return h >= 5 && h < 9 })},
	{ID: "x_weekend", Group: "special", Icon: "calendar", Tier: "streak", Name: "Выходные с пользой", Desc: "Темы закрыты и в субботу, и в воскресенье одной недели.", eval: weekend},
	{ID: "x_back", Group: "special", Icon: "gopher", Tier: "streak", Name: "С возвращением", Desc: "Тема закрыта после паузы в три дня и больше. Пропуск — не провал.", eval: comeback},
	{ID: "x_mile", Group: "special", Icon: "gopher", Tier: "success", Name: "Можно на собесы", Desc: "Закрыты все этапы до вехи. Можно пробовать себя на собеседованиях стажёра.", eval: milestone},
}

func init() {
	Defs = append(Defs, more...)
	for i := range Defs {
		d := &Defs[i]
		if d.Mark != "" {
			continue
		}
		switch d.Group {
		case "themes", "day", "streak", "week", "blocks", "month":
			d.Mark = strings.TrimLeft(d.ID, "tdswbm")
		}
	}
}

var more = []Def{
	{ID: "t2", Group: "themes", Icon: "spark", Tier: "accent", Name: "Не одна", Desc: "Вторая закрытая тема. Первая была не случайностью.", eval: countThemes(2)},
	{ID: "t7", Group: "themes", Icon: "star", Tier: "accent", Name: "Семь тем", Desc: "Семь закрытых тем — целая неделя по одной.", eval: countThemes(7)},
	{ID: "t20", Group: "themes", Icon: "layers", Tier: "accent", Name: "Двадцатка", Desc: "Двадцать тем позади.", eval: countThemes(20)},
	{ID: "t30", Group: "themes", Icon: "layers", Tier: "accent", Name: "Тридцать", Desc: "Тридцать закрытых тем. Это уже серьёзный объём.", eval: countThemes(30)},
	{ID: "t50", Group: "themes", Icon: "bolt", Tier: "accent", Name: "Полсотни", Desc: "Пятьдесят тем закрыто.", eval: countThemes(50)},
	{ID: "t70", Group: "themes", Icon: "compass", Tier: "accent", Name: "Семьдесят", Desc: "Семьдесят тем. Вы уже далеко от старта.", eval: countThemes(70)},
	{ID: "t90", Group: "themes", Icon: "compass", Tier: "accent", Name: "Половина", Desc: "Девяносто тем — ровно половина курса.", eval: countThemes(90)},
	{ID: "t120", Group: "themes", Icon: "crown", Tier: "accent", Name: "Две трети", Desc: "Сто двадцать тем: две трети пути.", eval: countThemes(120)},
	{ID: "t150", Group: "themes", Icon: "flag", Tier: "accent", Name: "Сто пятьдесят", Desc: "Сто пятьдесят тем. Финиш уже виден.", eval: countThemes(150)},
	{ID: "t170", Group: "themes", Icon: "flag", Tier: "accent", Name: "Последний десяток", Desc: "Сто семьдесят тем. Осталась последняя десятка.", eval: countThemes(170)},

	{ID: "d6", Group: "day", Icon: "rocket", Tier: "streak", Name: "Марафон", Desc: "Шесть тем за один день. Редкость, и хорошо, что редкость.", eval: perDay(6)},

	{ID: "s4", Group: "streak", Icon: "flame", Tier: "streak", Name: "Четыре дня", Desc: "Четыре дня подряд с закрытой темой.", eval: streak(4)},
	{ID: "s6", Group: "streak", Icon: "flame", Tier: "streak", Name: "Шесть дней", Desc: "Шесть дней подряд. До недели — один шаг.", eval: streak(6)},
	{ID: "s45", Group: "streak", Icon: "sun", Tier: "streak", Name: "Полтора месяца", Desc: "Сорок пять дней подряд с закрытой темой.", eval: streak(45)},
	{ID: "s60", Group: "streak", Icon: "sun", Tier: "streak", Name: "Два месяца", Desc: "Шестьдесят дней подряд. Учёба стала частью дня.", eval: streak(60)},

	{ID: "w3", Group: "week", Icon: "wave", Tier: "accent", Name: "Неделя в ритме", Desc: "Три темы за одну календарную неделю.", eval: perWeek(3)},
	{ID: "w7", Group: "week", Icon: "wave", Tier: "accent", Name: "Тема на каждый день", Desc: "Семь тем за календарную неделю.", eval: perWeek(7)},
	{ID: "w20", Group: "week", Icon: "rocket", Tier: "accent", Name: "Неделя-легенда", Desc: "Двадцать тем за одну неделю.", eval: perWeek(20)},

	{ID: "m20", Group: "month", Icon: "calendar", Tier: "success", Name: "Хороший месяц", Desc: "Двадцать тем за один календарный месяц.", eval: perMonth(20)},
	{ID: "m40", Group: "month", Icon: "calendar", Tier: "success", Name: "Сильный месяц", Desc: "Сорок тем за один календарный месяц.", eval: perMonth(40)},

	{ID: "b2", Group: "blocks", Icon: "block", Tier: "success", Name: "Второй блок", Desc: "Два закрытых блока.", eval: blocksClosed(2)},
	{ID: "b3", Group: "blocks", Icon: "block", Tier: "success", Name: "Три блока", Desc: "Три блока позади.", eval: blocksClosed(3)},
	{ID: "b15", Group: "blocks", Icon: "grid", Tier: "success", Name: "Пятнадцать блоков", Desc: "Пятнадцать закрытых блоков.", eval: blocksClosed(15)},
	{ID: "b25", Group: "blocks", Icon: "grid", Tier: "success", Name: "Двадцать пять блоков", Desc: "Двадцать пять блоков закрыто.", eval: blocksClosed(25)},
	{ID: "b45", Group: "blocks", Icon: "grid", Tier: "success", Name: "Сорок пять блоков", Desc: "Сорок пять блоков. Остались считаные.", eval: blocksClosed(45)},

	{ID: "n_hello", Group: "topic", Icon: "term", Mark: "main()", Tier: "accent", Name: "Hello, world", Desc: "Закрыт блок GO-1 «Первая программа».", Sub: "GO-1", eval: blockID("GO-1")},
	{ID: "n_ptr", Group: "topic", Icon: "term", Mark: "*p", Tier: "accent", Name: "По адресу", Desc: "Закрыт блок GO-6 «Указатели».", Sub: "GO-6", eval: blockID("GO-6")},
	{ID: "n_slice", Group: "topic", Icon: "term", Mark: "[]T", Tier: "accent", Name: "Слайсы без сюрпризов", Desc: "Закрыт блок GO-7 «Массивы и слайсы». append больше не пугает.", Sub: "GO-7", eval: blockID("GO-7")},
	{ID: "n_map", Group: "topic", Icon: "term", Mark: "map", Tier: "accent", Name: "Ключ и значение", Desc: "Закрыт блок GO-9 «Map».", Sub: "GO-9", eval: blockID("GO-9")},
	{ID: "n_iface", Group: "topic", Icon: "term", Mark: "any", Tier: "accent", Name: "Утиная типизация", Desc: "Закрыт блок GO-12 «Интерфейсы».", Sub: "GO-12", eval: blockID("GO-12")},
	{ID: "n_err", Group: "topic", Icon: "term", Mark: "err", Tier: "accent", Name: "if err != nil", Desc: "Закрыт блок GO-13 «Ошибки». Ошибка — обычное значение.", Sub: "GO-13", eval: blockID("GO-13")},
	{ID: "n_gen", Group: "topic", Icon: "term", Mark: "[T]", Tier: "accent", Name: "Обобщённо", Desc: "Закрыт блок GO-14 «Дженерики».", Sub: "GO-14", eval: blockID("GO-14")},
	{ID: "n_go", Group: "topic", Icon: "term", Mark: "go f()", Tier: "accent", Name: "Горутина", Desc: "Закрыт блок GO-15 «Горутины».", Sub: "GO-15", eval: blockID("GO-15")},
	{ID: "n_chan", Group: "topic", Icon: "term", Mark: "<-ch", Tier: "accent", Name: "Из канала", Desc: "Закрыт блок GO-17 «Каналы и select».", Sub: "GO-17", eval: blockID("GO-17")},
	{ID: "n_ctx", Group: "topic", Icon: "term", Mark: "ctx", Tier: "accent", Name: "Вовремя остановиться", Desc: "Закрыт блок GO-19 «context».", Sub: "GO-19", eval: blockID("GO-19")},

	{ID: "f_fund", Group: "tracks", Icon: "chip", Tier: "success", Name: "Как работает машина", Desc: "Закрыты все темы трека ФУНД: процессор, память, потоки.", eval: trackDone("ФУНД")},
	{ID: "f_sql", Group: "tracks", Icon: "db", Tier: "success", Name: "SELECT без страха", Desc: "Закрыты все темы по SQL.", eval: trackDone("SQL")},
	{ID: "f_pg", Group: "tracks", Icon: "db", Tier: "success", Name: "Postgres изнутри", Desc: "Закрыты все темы про устройство Postgres.", eval: trackDone("PG")},
	{ID: "f_net", Group: "tracks", Icon: "net", Tier: "success", Name: "Вся сеть", Desc: "Закрыты все сетевые темы: от пакета до REST.", eval: trackDone("СЕТЬ")},
	{ID: "f_test", Group: "tracks", Icon: "check", Tier: "success", Name: "Покрыто тестами", Desc: "Закрыты все темы про тестирование.", eval: trackDone("ТЕСТ")},
	{ID: "f_infra", Group: "tracks", Icon: "box", Tier: "success", Name: "Прод под контролем", Desc: "Закрыты все инфраструктурные темы: Docker, кэш, наблюдаемость, CI/CD, Kubernetes.", eval: trackDone("ИНФРА")},
	{ID: "f_brok", Group: "tracks", Icon: "queue", Tier: "success", Name: "Доставлено", Desc: "Закрыты все темы про Kafka и RabbitMQ.", eval: trackDone("БРОК")},
	{ID: "f_sysd", Group: "tracks", Icon: "compass", Tier: "success", Name: "Архитектор", Desc: "Закрыты все темы по системному дизайну.", eval: trackDone("СИСД")},

	{ID: "bk0", Group: "topic", Icon: "chip", Mark: "asm", Tier: "accent", Name: "Машинный язык", Desc: "Закрыт блок ФУНД-1 «От исходника к процессу». Теперь понятно, что происходит между текстом программы и её работой.", Sub: "ФУНД-1", eval: blockID("ФУНД-1")},
	{ID: "bk1", Group: "topic", Icon: "chip", Mark: "0b1010", Tier: "accent", Name: "Нули и единицы", Desc: "Закрыт блок ФУНД-2 «Числа и текст в памяти». Байты, UTF-8 и переполнение больше не загадка.", Sub: "ФУНД-2", eval: blockID("ФУНД-2")},
	{ID: "bk2", Group: "topic", Icon: "layers", Mark: "stack", Tier: "accent", Name: "Стек и куча", Desc: "Закрыт блок ФУНД-3 «Память процесса».", Sub: "ФУНД-3", eval: blockID("ФУНД-3")},
	{ID: "bk3", Group: "topic", Icon: "term", Mark: "x := 1", Tier: "accent", Name: "Короткое объявление", Desc: "Закрыт блок GO-2 «Переменные и базовые типы».", Sub: "GO-2", eval: blockID("GO-2")},
	{ID: "bk4", Group: "topic", Icon: "return", Mark: "for {}", Tier: "accent", Name: "Бесконечный цикл", Desc: "Закрыт блок GO-3 «Условия, циклы, области видимости».", Sub: "GO-3", eval: blockID("GO-3")},
	{ID: "bk5", Group: "topic", Icon: "db", Mark: "SELECT", Tier: "accent", Name: "SELECT *", Desc: "Закрыт блок SQL-1 «Первые запросы к базе данных».", Sub: "SQL-1", eval: blockID("SQL-1")},
	{ID: "bk6", Group: "topic", Icon: "bolt", Mark: "func", Tier: "accent", Name: "Первоклассные функции", Desc: "Закрыт блок GO-4 «Функции». Замыкания, defer и recover позади.", Sub: "GO-4", eval: blockID("GO-4")},
	{ID: "bk7", Group: "topic", Icon: "box", Mark: "go.mod", Tier: "accent", Name: "Свой модуль", Desc: "Закрыт блок GO-5 «Пакеты и модули».", Sub: "GO-5", eval: blockID("GO-5")},
	{ID: "bk8", Group: "topic", Icon: "chat", Mark: "rune", Tier: "accent", Name: "Руны и байты", Desc: "Закрыт блок GO-8 «Строки изнутри».", Sub: "GO-8", eval: blockID("GO-8")},
	{ID: "bk9", Group: "topic", Icon: "db", Mark: "JOIN", Tier: "accent", Name: "Связали таблицы", Desc: "Закрыт блок SQL-2 «Связи между таблицами».", Sub: "SQL-2", eval: blockID("SQL-2")},
	{ID: "bk10", Group: "topic", Icon: "grid", Mark: "struct", Tier: "accent", Name: "Своя структура", Desc: "Закрыт блок GO-10 «Структуры».", Sub: "GO-10", eval: blockID("GO-10")},
	{ID: "bk11", Group: "topic", Icon: "layers", Mark: "(t T)", Tier: "accent", Name: "Методы на месте", Desc: "Закрыт блок GO-11 «Методы, встраивание и время».", Sub: "GO-11", eval: blockID("GO-11")},
	{ID: "bk12", Group: "topic", Icon: "db", Mark: "GROUP BY", Tier: "accent", Name: "Сгруппировано", Desc: "Закрыт блок SQL-3 «Агрегация и сложные запросы».", Sub: "SQL-3", eval: blockID("SQL-3")},
	{ID: "bk13", Group: "topic", Icon: "bolt", Mark: "race", Tier: "accent", Name: "Гонка поймана", Desc: "Закрыт блок ФУНД-4 «Потоки, параллельность и гонки».", Sub: "ФУНД-4", eval: blockID("ФУНД-4")},
	{ID: "bk14", Group: "topic", Icon: "compass", Mark: "GMP", Tier: "accent", Name: "Внутри планировщика", Desc: "Закрыт блок GO-16 «Планировщик Go». G, M и P больше не буквы.", Sub: "GO-16", eval: blockID("GO-16")},
	{ID: "bk15", Group: "topic", Icon: "lock", Mark: "Mutex", Tier: "accent", Name: "Под замком", Desc: "Закрыт блок GO-18 «Пакет sync, атомики и модель памяти».", Sub: "GO-18", eval: blockID("GO-18")},
	{ID: "bk16", Group: "topic", Icon: "db", Mark: "BEGIN", Tier: "accent", Name: "Транзакция", Desc: "Закрыт блок PG-1 «Транзакции и конкурентный доступ в Postgres».", Sub: "PG-1", eval: blockID("PG-1")},
	{ID: "bk17", Group: "topic", Icon: "queue", Mark: "fan-in", Tier: "accent", Name: "Паттерны конкурентности", Desc: "Закрыт блок GO-20 «Паттерны конкурентности»: пулы, fan-in, fan-out.", Sub: "GO-20", eval: blockID("GO-20")},
	{ID: "bk18", Group: "topic", Icon: "sun", Mark: "GC", Tier: "accent", Name: "Сборщик мусора", Desc: "Закрыт блок GO-21 «Память и сборщик мусора».", Sub: "GO-21", eval: blockID("GO-21")},
	{ID: "bk19", Group: "topic", Icon: "net", Mark: "TCP", Tier: "accent", Name: "Рукопожатие", Desc: "Закрыт блок СЕТЬ-1 «Как устроена сеть».", Sub: "СЕТЬ-1", eval: blockID("СЕТЬ-1")},
	{ID: "bk20", Group: "topic", Icon: "lock", Mark: "TLS", Tier: "accent", Name: "Защищённое соединение", Desc: "Закрыт блок СЕТЬ-2 «HTTP и TLS».", Sub: "СЕТЬ-2", eval: blockID("СЕТЬ-2")},
	{ID: "bk21", Group: "topic", Icon: "net", Mark: "REST", Tier: "accent", Name: "REST по правилам", Desc: "Закрыт блок СЕТЬ-3 «REST и аутентификация».", Sub: "СЕТЬ-3", eval: blockID("СЕТЬ-3")},
	{ID: "bk22", Group: "topic", Icon: "term", Mark: "$ _", Tier: "accent", Name: "Свой в терминале", Desc: "Закрыт блок ОС-1 «Linux для бэкендера».", Sub: "ОС-1", eval: blockID("ОС-1")},
	{ID: "bk23", Group: "topic", Icon: "db", Mark: "INDEX", Tier: "accent", Name: "Быстрый запрос", Desc: "Закрыт блок PG-2 «Индексы и план запроса». EXPLAIN читается как текст.", Sub: "PG-2", eval: blockID("PG-2")},
	{ID: "bk24", Group: "topic", Icon: "net", Mark: ":8080", Tier: "accent", Name: "Сервер поднят", Desc: "Закрыт блок GO-22 «HTTP-сервер на net/http».", Sub: "GO-22", eval: blockID("GO-22")},
	{ID: "bk25", Group: "topic", Icon: "return", Mark: "GET", Tier: "accent", Name: "Клиент наготове", Desc: "Закрыт блок GO-23 «HTTP-клиент».", Sub: "GO-23", eval: blockID("GO-23")},
	{ID: "bk26", Group: "topic", Icon: "box", Mark: "proto", Tier: "accent", Name: "gRPC", Desc: "Закрыт блок GO-24 «gRPC и protobuf».", Sub: "GO-24", eval: blockID("GO-24")},
	{ID: "bk27", Group: "topic", Icon: "db", Mark: "pgx", Tier: "accent", Name: "Go и Postgres вместе", Desc: "Закрыт блок GO-25 «Go и Postgres».", Sub: "GO-25", eval: blockID("GO-25")},
	{ID: "bk28", Group: "topic", Icon: "layers", Mark: "layers", Tier: "accent", Name: "Чистые слои", Desc: "Закрыт блок АРХ-1 «Архитектура сервиса».", Sub: "АРХ-1", eval: blockID("АРХ-1")},
	{ID: "bk29", Group: "topic", Icon: "box", Mark: "FROM", Tier: "accent", Name: "В контейнере", Desc: "Закрыт блок ИНФРА-1 «Docker».", Sub: "ИНФРА-1", eval: blockID("ИНФРА-1")},
	{ID: "bk30", Group: "topic", Icon: "check", Mark: "t.Run", Tier: "accent", Name: "Тесты зелёные", Desc: "Закрыт блок ТЕСТ-1 «Тестирование».", Sub: "ТЕСТ-1", eval: blockID("ТЕСТ-1")},
	{ID: "bk31", Group: "topic", Icon: "queue", Mark: "async", Tier: "accent", Name: "Асинхронно", Desc: "Закрыт блок АРХ-2 «Асинхронное взаимодействие».", Sub: "АРХ-2", eval: blockID("АРХ-2")},
	{ID: "bk32", Group: "topic", Icon: "queue", Mark: "topic", Tier: "accent", Name: "Устройство Kafka", Desc: "Закрыт блок БРОК-1 «Kafka: устройство».", Sub: "БРОК-1", eval: blockID("БРОК-1")},
	{ID: "bk33", Group: "topic", Icon: "queue", Mark: "offset", Tier: "accent", Name: "Ровно один раз", Desc: "Закрыт блок БРОК-2 «Kafka: продюсер, консьюмер и гарантии».", Sub: "БРОК-2", eval: blockID("БРОК-2")},
	{ID: "bk34", Group: "topic", Icon: "queue", Mark: "AMQP", Tier: "accent", Name: "Кролик", Desc: "Закрыт блок БРОК-3 «RabbitMQ для сравнения».", Sub: "БРОК-3", eval: blockID("БРОК-3")},
	{ID: "bk35", Group: "topic", Icon: "bolt", Mark: "Redis", Tier: "accent", Name: "Из кэша", Desc: "Закрыт блок ИНФРА-2 «Кэширование и Redis».", Sub: "ИНФРА-2", eval: blockID("ИНФРА-2")},
	{ID: "bk36", Group: "topic", Icon: "wave", Mark: "p99", Tier: "accent", Name: "Всё видно", Desc: "Закрыт блок ИНФРА-3 «Наблюдаемость»: логи, метрики, трейсы.", Sub: "ИНФРА-3", eval: blockID("ИНФРА-3")},
	{ID: "bk37", Group: "topic", Icon: "return", Mark: "git", Tier: "accent", Name: "Пайплайн зелёный", Desc: "Закрыт блок ИНФРА-4 «Git и CI/CD».", Sub: "ИНФРА-4", eval: blockID("ИНФРА-4")},
	{ID: "bk38", Group: "topic", Icon: "grid", Mark: "k8s", Tier: "accent", Name: "Под в кластере", Desc: "Закрыт блок ИНФРА-5 «Kubernetes и выкладка».", Sub: "ИНФРА-5", eval: blockID("ИНФРА-5")},
	{ID: "bk39", Group: "topic", Icon: "compass", Mark: "design", Tier: "accent", Name: "На секции", Desc: "Закрыт блок СИСД-1 «Как вести секцию системного дизайна».", Sub: "СИСД-1", eval: blockID("СИСД-1")},
	{ID: "bk40", Group: "topic", Icon: "rocket", Mark: "scale", Tier: "accent", Name: "Масштаб", Desc: "Закрыт блок СИСД-2 «Масштабирование».", Sub: "СИСД-2", eval: blockID("СИСД-2")},
	{ID: "bk41", Group: "topic", Icon: "check", Mark: "SLA", Tier: "accent", Name: "Надёжно", Desc: "Закрыт блок СИСД-3 «Надёжность распределённой системы».", Sub: "СИСД-3", eval: blockID("СИСД-3")},
	{ID: "bk42", Group: "topic", Icon: "star", Mark: "case", Tier: "accent", Name: "Кейсы разобраны", Desc: "Закрыт блок СИСД-4 «Разбор кейсов».", Sub: "СИСД-4", eval: blockID("СИСД-4")},
	{ID: "bk43", Group: "topic", Icon: "gopher", Mark: "offer", Tier: "accent", Name: "Готовы к собесу", Desc: "Закрыт блок СБОР-1 «Сборка к собесу». Всё собрано в рассказ.", Sub: "СБОР-1", eval: blockID("СБОР-1")},

	{ID: "x_week7", Group: "special", Icon: "calendar", Tier: "streak", Name: "Вся неделя", Desc: "Темы закрывались в каждый из семи дней недели — в разные недели тоже считается.", eval: allWeekdays},
}

// Result — состояние достижения.
type Result struct {
	Def
	At time.Time // момент выполнения условия (может быть нулевым, если открыто массово)
	Ok bool
}

// Evaluate проверяет все достижения.
func Evaluate(in *stats.Input) []Result {
	c := build(in)
	out := make([]Result, 0, len(Defs))
	for _, d := range Defs {
		at, ok := d.eval(c)
		out = append(out, Result{Def: d, At: at, Ok: ok})
	}
	return out
}
