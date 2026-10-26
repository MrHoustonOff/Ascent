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

// ---------- каталог ----------

var Defs = []Def{
	// сколько тем закрыто
	{ID: "t1", Group: "themes", Icon: "spark", Tier: "accent", Name: "Первый шаг", Desc: "Закрыта первая тема: уроки пройдены, вопросы отвечены. Дальше проще.", eval: countThemes(1)},
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
	{ID: "t180", Group: "themes", Icon: "peak", Tier: "accent", Name: "Каждая тема", Desc: "Закрыта каждая тема курса. Вы прошли весь путь.", eval: countThemes(180)},

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
	{ID: "x_back", Group: "special", Icon: "return", Tier: "streak", Name: "С возвращением", Desc: "Тема закрыта после паузы в три дня и больше. Пропуск — не провал.", eval: comeback},
	{ID: "x_mile", Group: "special", Icon: "peak", Tier: "success", Name: "Можно на собесы", Desc: "Закрыты все этапы до вехи. Можно пробовать себя на собеседованиях стажёра.", eval: milestone},
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
