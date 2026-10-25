// Package stats считает учебный день, серию, темп, прогноз и хитмапу.
// Все функции принимают now и loc — логику можно тестировать с фиксированными часами.
package stats

import (
	"time"
)

const dayFmt = "2006-01-02"

// StudyDay — дата учебного дня, который начинается в dayStartHour.
func StudyDay(t time.Time, loc *time.Location, dayStartHour int) string {
	return t.In(loc).Add(-time.Duration(dayStartHour) * time.Hour).Format(dayFmt)
}

// ParseDay превращает "YYYY-MM-DD" в полночь UTC (для арифметики по датам).
func ParseDay(s string) time.Time {
	t, _ := time.Parse(dayFmt, s)
	return t
}

func key(t time.Time) string { return t.Format(dayFmt) }

// DaysBetween — число суток от a до b (b >= a).
func DaysBetween(a, b time.Time) int {
	return int(b.Sub(a).Round(24*time.Hour) / (24 * time.Hour))
}

// CurrentStreak — текущая серия: дни отдыха сохраняют серию, но не увеличивают её.
func CurrentStreak(days, rest map[string]bool, today time.Time) int {
	d := today
	if !days[key(d)] && !rest[key(d)] {
		d = d.AddDate(0, 0, -1) // сегодня ещё не поздно
	}
	n := 0
	for {
		k := key(d)
		switch {
		case days[k]:
			n++
		case rest[k]:
		default:
			return n
		}
		d = d.AddDate(0, 0, -1)
	}
}

// BestStreak — максимальная серия по всей истории тем же правилом.
func BestStreak(days, rest map[string]bool) int {
	if len(days) == 0 {
		return 0
	}
	first, last := time.Time{}, time.Time{}
	for k := range days {
		t := ParseDay(k)
		if first.IsZero() || t.Before(first) {
			first = t
		}
		if t.After(last) {
			last = t
		}
	}
	best, cur := 0, 0
	for d := first; !d.After(last); d = d.AddDate(0, 0, 1) {
		k := key(d)
		switch {
		case days[k]:
			cur++
			if cur > best {
				best = cur
			}
		case rest[k]:
		default:
			cur = 0
		}
	}
	return best
}

// WeekStart — понедельник недели, в которую входит day.
func WeekStart(day time.Time) time.Time {
	wd := (int(day.Weekday()) + 6) % 7 // пн=0
	return day.AddDate(0, 0, -wd)
}

// RestUsedThisWeek — сколько дней отдыха уже взято в текущей календарной неделе.
func RestUsedThisWeek(rest map[string]bool, today time.Time) int {
	ws := WeekStart(today)
	n := 0
	for i := 0; i < 7; i++ {
		if rest[key(ws.AddDate(0, 0, i))] {
			n++
		}
	}
	return n
}

// CanRest: можно ли взять отдых сегодня (нет активности, квота не исчерпана, день ещё не отдых).
func CanRest(days, rest map[string]bool, today time.Time, perWeek int) bool {
	k := key(today)
	if days[k] || rest[k] {
		return false
	}
	return RestUsedThisWeek(rest, today) < perWeek
}

// Level — уровень хитмапы по дневной цели g.
func Level(n, g int) int {
	if n <= 0 {
		return 0
	}
	if g < 1 {
		g = 1
	}
	ceil := func(a, b int) int { return (a + b - 1) / b }
	switch {
	case n >= g:
		return 4
	case n <= ceil(g, 3):
		return 1
	case n <= ceil(2*g, 3):
		return 2
	default:
		return 3
	}
}
