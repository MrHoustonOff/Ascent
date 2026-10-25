//go:build dev

package app

import (
	"time"

	"ascent/internal/store"
)

const demoAvailable = true

// FillDemo заполняет базу правдоподобной историей за ~6 недель. Только для разработки.
func (a *App) FillDemo() error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if err := a.st.Reset(); err != nil {
		return err
	}
	if _, err := a.st.Sync(a.plan); err != nil {
		return err
	}
	_ = a.st.SetSetting("onboarded", "1")
	real := a.st.Now
	defer func() { a.st.Now = real }()

	today := a.Now().In(a.Loc)
	today = time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, a.Loc)
	pattern := []int{2, 1, 2, 3, 0, 2, 1, 2, 2, -1, 3, 2, 1, 0, 2, 2, 3, 1, 2, -1, 2, 2, 1, 3, 2, 0, 2, 1, 2, 2, 3, 2, 1, -1, 2, 2, 1, 2, 3, 2, 2, 1}
	var themesInOrder []string
	for _, st := range a.plan.Stages {
		for _, b := range st.Blocks {
			for _, th := range b.Themes {
				themesInOrder = append(themesInOrder, th.ID)
			}
		}
	}
	idx := 0
	n := len(pattern)
	for i := 0; i < n; i++ {
		day := today.AddDate(0, 0, -(n - i))
		c := pattern[i]
		if c < 0 {
			if err := a.st.AddRest(day.Format("2006-01-02")); err != nil {
				return err
			}
			continue
		}
		hour := 9
		for k := 0; k < c && idx < len(themesInOrder); k++ {
			th := a.plan.Themes[themesInOrder[idx]]
			idx++
			for _, l := range th.Lessons {
				a.st.Now = func() time.Time { return day.Add(time.Duration(hour)*time.Hour + 5*time.Minute) }
				if err := a.st.StartLesson(l.ID); err != nil {
					return err
				}
				hour++
				a.st.Now = func() time.Time { return day.Add(time.Duration(hour)*time.Hour - 20*time.Minute) }
				if err := a.st.CompleteLesson(l.ID); err != nil {
					return err
				}
			}
			a.st.Now = func() time.Time { return day.Add(time.Duration(hour)*time.Hour + 10*time.Minute) }
			for _, c := range th.Checks {
				if err := a.st.SetCheck(th.ID, store.CheckKey(th.ID, c), true); err != nil {
					return err
				}
			}
			hour++
		}
		// дни без закрытых тем, но с работой: иногда один урок следующей темы
		if c == 0 && idx < len(themesInOrder) && i%2 == 0 {
			th := a.plan.Themes[themesInOrder[idx]]
			a.st.Now = func() time.Time { return day.Add(15 * time.Hour) }
			if err := a.st.StartLesson(th.Lessons[0].ID); err == nil {
				a.st.Now = func() time.Time { return day.Add(16 * time.Hour) }
				_ = a.st.CompleteLesson(th.Lessons[0].ID)
			}
		}
	}
	// сегодня: одна тема закрыта, следующая начата
	a.st.Now = real
	day := today
	th := a.plan.Themes[themesInOrder[idx]]
	idx++
	for _, l := range th.Lessons {
		a.st.Now = func() time.Time { return day.Add(10 * time.Hour) }
		if err := a.st.StartLesson(l.ID); err != nil {
			return err
		}
		a.st.Now = func() time.Time { return day.Add(11 * time.Hour) }
		_ = a.st.CompleteLesson(l.ID)
	}
	a.st.Now = func() time.Time { return day.Add(12 * time.Hour) }
	for _, c := range th.Checks {
		_ = a.st.SetCheck(th.ID, store.CheckKey(th.ID, c), true)
	}
	next := a.plan.Themes[themesInOrder[idx]]
	// пройден первый урок следующей темы, второй начат
	a.st.Now = func() time.Time { return day.Add(19 * time.Hour) }
	_ = a.st.StartLesson(next.Lessons[0].ID)
	a.st.Now = func() time.Time { return day.Add(19*time.Hour + 30*time.Minute) }
	_ = a.st.CompleteLesson(next.Lessons[0].ID)
	if len(next.Lessons) > 1 {
		a.st.Now = func() time.Time { return day.Add(20 * time.Hour) }
		_ = a.st.StartLesson(next.Lessons[1].ID)
	}
	return nil
}
