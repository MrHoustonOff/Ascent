// Package clip собирает тексты для копирования (раздел 11 гайда).
package clip

import (
	"fmt"
	"strings"

	"ascent/internal/plan"
)

// LessonOpts — настройки шаблона урока для Гермеса.
type LessonOpts struct {
	Template  string
	WithBrief bool
	WithDeps  bool
}

func trimEmpty(s string) string {
	var out []string
	for _, ln := range strings.Split(s, "\n") {
		if strings.TrimSpace(ln) != "" {
			out = append(out, strings.TrimRight(ln, " \t"))
		}
	}
	return strings.Join(out, "\n")
}

// Lesson — текст урока для Гермеса (11.1).
func Lesson(p *plan.Plan, id string, o LessonOpts) (string, error) {
	l := p.Lessons[id]
	if l == nil {
		return "", fmt.Errorf("нет урока %s", id)
	}
	if l.Kind == "run" {
		return StageRun(p, p.Blocks[l.Block].Stage), nil
	}
	th := p.Themes[l.Theme]
	var brief, arrows []string
	themeID, themeTitle := "", ""
	if th != nil {
		themeID, themeTitle = th.ID, th.Title
		if o.WithBrief {
			for _, b := range th.Brief {
				brief = append(brief, "> "+b)
			}
		}
	}
	for _, a := range l.Arrows {
		arrows = append(arrows, "  ↳ "+a.Kind+": "+a.Text)
	}
	stars := ""
	if l.Stars > 0 {
		stars = " " + strings.Repeat("★", l.Stars)
	}
	r := strings.NewReplacer(
		"{theme_id}", themeID,
		"{theme_title}", themeTitle,
		"{brief}", strings.Join(brief, "\n"),
		"{lesson_id}", l.ID,
		"{lesson_title}", l.Title,
		"{stars}", stars,
		"{arrows}", strings.Join(arrows, "\n"),
		"{block_id}", l.Block,
	)
	tpl := o.Template
	if strings.TrimSpace(tpl) == "" {
		tpl = "Тема {theme_id} {theme_title}\n{brief}\nУрок {lesson_id} — {lesson_title}{stars}\n{arrows}"
	}
	out := trimEmpty(r.Replace(tpl))
	if o.WithDeps {
		if b := p.Blocks[l.Block]; b != nil && len(b.Deps) > 0 {
			out += "\nБлок " + b.ID + " стоит на: " + strings.Join(b.Deps, ", ")
		}
	}
	return out, nil
}

// ThemeCheck — проверка темы (11.2).
func ThemeCheck(p *plan.Plan, themeID string) (string, error) {
	th := p.Themes[themeID]
	if th == nil {
		return "", fmt.Errorf("нет темы %s", themeID)
	}
	var ls []string
	for _, l := range th.Lessons {
		ls = append(ls, l.ID+" "+l.Title)
	}
	var b strings.Builder
	fmt.Fprintf(&b, "Проверь меня по теме %s %s. Задавай вопросы по одному, жди моего ответа, оценивай его и в конце скажи, к каким урокам вернуться.\n", th.ID, th.Title)
	fmt.Fprintf(&b, "Уроки темы: %s\nВопросы:", strings.Join(ls, "; "))
	for i, c := range th.Checks {
		fmt.Fprintf(&b, "\n%d. %s", i+1, c)
	}
	return b.String(), nil
}

func markerLines(qs []*plan.BankQ) string {
	var b strings.Builder
	for i, q := range qs {
		if i > 0 {
			b.WriteString("\n")
		}
		fmt.Fprintf(&b, "%d. %s", i+1, q.Text)
		if len(q.Lessons) > 0 {
			fmt.Fprintf(&b, " (уроки: %s)", strings.Join(q.Lessons, ", "))
		}
	}
	return b.String()
}

// BlockMarkers — маркеры блока (11.3).
func BlockMarkers(p *plan.Plan, blockID string) (string, error) {
	blk := p.Blocks[blockID]
	if blk == nil {
		return "", fmt.Errorf("нет блока %s", blockID)
	}
	return fmt.Sprintf("Закрываю блок %s %s. Это вопросы с собесов. Задавай по одному, без подсказок; после каждого ответа скажи, чего не хватило.\n%s",
		blk.ID, blk.Title, markerLines(p.Markers(blockID))), nil
}

// StageRun — прогон этапа (11.4).
func StageRun(p *plan.Plan, stage int) string {
	run := ""
	for _, s := range p.Stages {
		if s.Num != stage {
			continue
		}
		for _, b := range s.Blocks {
			if b.Run != nil {
				run = b.Run.Title
				return fmt.Sprintf("%s. %s\nМаркеры этапа:\n%s", b.Run.ID, run, markerLines(p.StageMarkers(stage)))
			}
		}
	}
	return fmt.Sprintf("ПРОГОН-%d.\nМаркеры этапа:\n%s", stage, markerLines(p.StageMarkers(stage)))
}

// DoneIDs — все пройденные ID через запятую в порядке плана.
func DoneIDs(p *plan.Plan, done map[string]bool) string {
	var ids []string
	for _, id := range p.Order {
		if done[id] {
			ids = append(ids, id)
		}
	}
	return strings.Join(ids, ", ")
}

type StatusData struct {
	Done, Total, Pct, Stage int
	Current, CurrentTitle   string
	PacePerDay              string // «1,2»
	Streak                  int
	LastThemes              []string // «ID title»
}

// Status — сводка прогресса (11.5). Темп считается в темах.
func Status(d StatusData) string {
	s := fmt.Sprintf("Мой прогресс по Go — ROADMAP: пройдено %d из %d уроков (%d %%), этап %d.\n", d.Done, d.Total, d.Pct, d.Stage)
	s += fmt.Sprintf("Сейчас: %s %s.\n", d.Current, d.CurrentTitle)
	s += fmt.Sprintf("Темп: %s тем в день за 14 дней. Серия: %d дн.", d.PacePerDay, d.Streak)
	if len(d.LastThemes) > 0 {
		s += "\nПоследние закрытые темы: " + strings.Join(d.LastThemes, "; ") + "."
	}
	return s
}

// Term — «термин — ID урока».
func Term(name, ref string) string { return name + " — " + ref }
