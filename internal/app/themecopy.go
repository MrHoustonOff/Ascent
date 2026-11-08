package app

import (
	"fmt"
	"strings"
)

// ThemeCopyOpts — что положить в буфер из темы (окно «Скопировать тему»).
type ThemeCopyOpts struct {
	Brief     bool     `json:"brief"`     // «Тема … » и бриф
	Lessons   []string `json:"lessons"`   // какие уроки
	Questions bool     `json:"questions"` // вопросы конспекта урока
	Know      bool     `json:"know"`      // «Должен знать» из конспекта
	Arrows    bool     `json:"arrows"`    // связи урока («стоит на …»)
	Checks    bool     `json:"checks"`    // «Должен уметь ответить» темы
	Clip      bool     `json:"clip"`      // true — положить в буфер, false — только предпросмотр
}

// CopyTheme собирает тему целиком: шапка один раз, затем выбранные уроки с вопросами, в конце вопросы темы.
func (a *App) CopyTheme(themeID string, o ThemeCopyOpts) (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	th := a.plan.Themes[themeID]
	if th == nil {
		return "", errNotFound(themeID)
	}
	want := map[string]bool{}
	for _, id := range o.Lessons {
		want[id] = true
	}
	var parts []string
	if o.Brief {
		var b strings.Builder
		fmt.Fprintf(&b, "Тема %s %s", th.ID, plainTitle(th.Title))
		for _, x := range th.Brief {
			b.WriteString("\n> " + x)
		}
		parts = append(parts, b.String())
	}
	for _, l := range th.Lessons {
		if !want[l.ID] {
			continue
		}
		var b strings.Builder
		stars := ""
		if l.Stars > 0 {
			stars = " " + strings.Repeat("★", l.Stars)
		}
		fmt.Fprintf(&b, "Урок %s — %s%s", l.ID, plainTitle(l.Title), stars)
		if o.Arrows {
			for _, ar := range l.Arrows {
				b.WriteString("\n  ↳ " + ar.Kind + ": " + ar.Text)
			}
		}
		if k := a.ksp[l.ID]; k != nil {
			if o.Questions && len(k.Qs) > 0 {
				b.WriteString("\n\nВопросы:")
				for _, q := range k.Qs {
					b.WriteString("\n- " + q.Text)
				}
			}
			if o.Know && len(k.Know) > 0 {
				b.WriteString("\n\nДолжен знать:\n" + strings.Join(k.Know, "\n"))
			}
		}
		parts = append(parts, b.String())
	}
	if o.Checks && len(th.Checks) > 0 {
		var b strings.Builder
		b.WriteString("Должен уметь ответить по теме:")
		for i, c := range th.Checks {
			fmt.Fprintf(&b, "\n%d. %s", i+1, c)
		}
		parts = append(parts, b.String())
	}
	txt := strings.Join(parts, "\n\n")
	if o.Clip && txt != "" {
		a.setClip(txt)
	}
	return txt, nil
}
