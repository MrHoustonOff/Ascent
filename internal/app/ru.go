package app

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

var monthsGen = []string{"января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"}
var monthsShort = []string{"янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"}
var monthsNom = []string{"Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"}
var weekdaysNom = []string{"Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"}
var weekdaysShort = []string{"Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"}

// plural выбирает форму по числу: 1 тема, 2 темы, 5 тем.
func plural(n int, one, few, many string) string {
	if n < 0 {
		n = -n
	}
	m10, m100 := n%10, n%100
	switch {
	case m10 == 1 && m100 != 11:
		return one
	case m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14):
		return few
	}
	return many
}

func themes(n int) string {
	return fmt.Sprintf("%d %s", n, plural(n, "тема", "темы", "тем"))
}
func lessons(n int) string {
	return fmt.Sprintf("%d %s", n, plural(n, "урок", "урока", "уроков"))
}
func days(n int) string { return fmt.Sprintf("%d %s", n, plural(n, "день", "дня", "дней")) }

// num форматирует число с запятой: 1,4.
func num(v float64) string {
	s := strconv.FormatFloat(v, 'f', 1, 64)
	s = strings.TrimSuffix(s, ".0")
	return strings.Replace(s, ".", ",", 1)
}

func dateGen(t time.Time) string { return fmt.Sprintf("%d %s", t.Day(), monthsGen[t.Month()-1]) }

func dateShort(t time.Time) string { return fmt.Sprintf("%d %s", t.Day(), monthsShort[t.Month()-1]) }

func greeting(h int) string {
	switch {
	case h >= 5 && h < 12:
		return "Доброе утро."
	case h >= 12 && h < 18:
		return "Добрый день."
	case h >= 18 && h < 23:
		return "Добрый вечер."
	}
	return "Доброй ночи."
}
