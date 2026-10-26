package app

import (
	"fmt"
	"io/fs"
	"strings"

	"ascent/internal/konspekt"
	"ascent/internal/plan"
)

// ---------- конспекты уроков ----------

type KQDTO struct {
	N     int       `json:"n"`
	Text  string    `json:"text"`
	Query string    `json:"query"`
	Refs  []LinkDTO `json:"refs"`
	Done  bool      `json:"done"`
}

type KTermDTO struct {
	Name string `json:"name"`
	Desc string `json:"desc"`
	New  bool   `json:"new"`
}

type KLaterDTO struct {
	Text  string    `json:"text"`
	Links []LinkDTO `json:"links"`
}

// LinkDTO — ссылка на урок, тему или блок с относительным положением («через 12 уроков»).
type LinkDTO struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Status string `json:"status"`
	Rel    string `json:"rel"`
}

type KonspektDTO struct {
	ID     string      `json:"id"`
	Qs     []KQDTO     `json:"qs"`
	Done   int         `json:"done"`
	Google []string    `json:"google"`
	Know   []string    `json:"know"`
	Terms  []KTermDTO  `json:"terms"`
	Border string      `json:"border"`
	BLinks []LinkDTO   `json:"borderLinks"`
	Later  []KLaterDTO `json:"later"`
}

// loadKonspekt: папка konspekty рядом с планом, иначе встроенные.
func (a *App) loadKonspekt(planFS fs.FS) {
	if planFS != nil {
		if sub, err := fs.Sub(planFS, "konspekty"); err == nil {
			if k, err := konspekt.Parse(sub); err == nil && len(k) > 0 {
				a.ksp = k
				return
			}
		}
	}
	k, err := konspekt.Parse(konspekt.Embedded())
	if err != nil {
		a.log("konspekt: %v", err)
	}
	a.ksp = k
}

// Konspekt — конспект урока для вкладок в строке урока.
func (a *App) Konspekt(id string) (KonspektDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return KonspektDTO{}, err
	}
	k := a.ksp[id]
	if k == nil || a.plan.Lessons[id] == nil {
		return KonspektDTO{}, errNotFound(id)
	}
	d := KonspektDTO{ID: id, Qs: []KQDTO{}, Google: nonNil(k.Google), Know: nonNil(k.Know), Terms: []KTermDTO{}, Border: k.Border, BLinks: []LinkDTO{}, Later: []KLaterDTO{}}
	for i, q := range k.Qs {
		_, done := s.kq[q.Key]
		if done {
			d.Done++
		}
		x := KQDTO{N: i + 1, Text: q.Text, Query: q.Query, Done: done, Refs: []LinkDTO{}}
		for _, r := range q.Refs {
			x.Refs = append(x.Refs, s.link(id, r))
		}
		d.Qs = append(d.Qs, x)
	}
	for _, t := range k.Terms {
		d.Terms = append(d.Terms, KTermDTO{Name: t.Name, Desc: t.Desc, New: t.New})
	}
	for _, r := range reIDText.FindAllString(k.Border, -1) {
		d.BLinks = append(d.BLinks, s.link(id, r))
	}
	for _, l := range k.Later {
		x := KLaterDTO{Text: l.Text, Links: []LinkDTO{}}
		for _, r := range l.IDs {
			x.Links = append(x.Links, s.link(id, r))
		}
		d.Later = append(d.Later, x)
	}
	return d, nil
}

// SetKQ отмечает вопрос конспекта (n — номер с 1).
func (a *App) SetKQ(lesson string, n int, done bool) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	k := a.ksp[lesson]
	if k == nil || n < 1 || n > len(k.Qs) {
		return errNotFound(fmt.Sprintf("%s#%d", lesson, n))
	}
	return a.st.SetKQ(lesson, k.Qs[n-1].Key, done)
}

// kqCounts — сколько вопросов конспекта у урока и сколько отмечено.
func (s *snap) kqCounts(id string) (done, total int) {
	k := s.a.ksp[id]
	if k == nil {
		return 0, 0
	}
	for _, q := range k.Qs {
		if _, ok := s.kq[q.Key]; ok {
			done++
		}
	}
	return done, len(k.Qs)
}

// firstLesson — первый урок урока/темы/блока/этапа по ID, для относительного положения.
func (a *App) firstLesson(id string) (*plan.Lesson, string) {
	if l := a.plan.Lessons[id]; l != nil {
		return l, l.Title
	}
	if t := a.plan.Themes[id]; t != nil && len(t.Lessons) > 0 {
		return t.Lessons[0], t.Title
	}
	if b := a.plan.Blocks[id]; b != nil {
		title := strings.TrimSuffix(b.Title, ".")
		if len(b.Themes) > 0 && len(b.Themes[0].Lessons) > 0 {
			return b.Themes[0].Lessons[0], title
		}
		return b.Run, title
	}
	return nil, ""
}

func (s *snap) link(from, id string) LinkDTO {
	d := LinkDTO{ID: id}
	tl, title := s.a.firstLesson(id)
	d.Title = title
	if l := s.a.plan.Lessons[id]; l != nil {
		d.Status = s.status(id)
		if d.Status == "" {
			d.Status = "todo"
		}
	}
	fl := s.a.plan.Lessons[from]
	if tl == nil || fl == nil {
		return d
	}
	n := tl.Ord - fl.Ord
	switch {
	case n == 0:
		d.Rel = "этот урок"
	case tl.Theme != "" && tl.Theme == fl.Theme:
		if n > 0 {
			d.Rel = "дальше в этой теме"
		} else {
			d.Rel = "раньше в этой теме"
		}
	case n > 0:
		d.Rel = "через " + lessons(n)
	default:
		d.Rel = lessons(-n) + " назад"
	}
	return d
}

func nonNil(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}

// konspektText — конспект урока целиком, для копирования.
func (a *App) konspektText(id string, onlyQs bool) (string, error) {
	k, l := a.ksp[id], a.plan.Lessons[id]
	if k == nil || l == nil {
		return "", errNotFound(id)
	}
	var b strings.Builder
	fmt.Fprintf(&b, "%s %s\n\nВопросы:\n", id, plainTitle(l.Title))
	for _, q := range k.Qs {
		fmt.Fprintf(&b, "- %s", q.Text)
		if q.Query != "" && !onlyQs {
			fmt.Fprintf(&b, " (гуглить: %s)", q.Query)
		}
		b.WriteString("\n")
	}
	if onlyQs {
		return strings.TrimRight(b.String(), "\n"), nil
	}
	if len(k.Google) > 0 {
		fmt.Fprintf(&b, "\nГуглить: %s\n", strings.Join(k.Google, " · "))
	}
	fmt.Fprintf(&b, "\nДолжен знать:\n%s\n", strings.Join(k.Know, "\n"))
	if len(k.Terms) > 0 {
		b.WriteString("\nТермины:\n")
		for _, t := range k.Terms {
			fmt.Fprintf(&b, "- %s — %s\n", t.Name, t.Desc)
		}
	}
	if k.Border != "" {
		fmt.Fprintf(&b, "\nГраница: %s\n", k.Border)
	}
	if len(k.Later) > 0 {
		var parts []string
		for _, x := range k.Later {
			if len(x.IDs) > 0 {
				parts = append(parts, x.Text+" — "+strings.Join(x.IDs, ", "))
			} else {
				parts = append(parts, x.Text)
			}
		}
		fmt.Fprintf(&b, "\nПозже: %s\n", strings.Join(parts, "; "))
	}
	return strings.TrimRight(b.String(), "\n"), nil
}

func plainTitle(t string) string { return strings.TrimSpace(strings.ReplaceAll(t, "★", "")) }
