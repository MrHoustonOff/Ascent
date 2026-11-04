package app

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"

	"ascent/internal/plan"
	"ascent/internal/stats"
)

// Галерея: на каждый этап четыре картины — 25, 50, 75 % уроков и закрытие этапа.
// Картина открывается в момент, когда урок, переводящий этап за порог, отмечен пройденным
// (для 100 % — когда закрыт весь этап: уроки, вопросы и ◆). Постоянные картины живут во фронтенде.

var galleryPcts = []int{25, 50, 75, 100}

// PaintingDTO — картина этапа в галерее.
type PaintingDTO struct {
	ID       string `json:"id"`  // «stage-3-50»
	Num      int    `json:"num"` // этап
	Pct      int    `json:"pct"`
	Title    string `json:"title"` // «Конкурентность и рантайм»
	Unlocked bool   `json:"unlocked"`
	Date     string `json:"date"` // YYYY-MM-DD; пусто — открыта отметками «пройдено ранее»
	When     string `json:"when"` // «12 октября»
}

func paintingID(num, pct int) string { return fmt.Sprintf("stage-%d-%d", num, pct) }

// stageShort — название этапа без подзаголовка: «Основы: от исходника…» → «Основы».
func stageShort(t string) string {
	for i, r := range t {
		if r == ':' {
			return t[:i]
		}
	}
	return t
}

// stageLessons — уроки этапа по порядку плана (с прогонами блоков).
func stageLessons(st *plan.Stage) []*plan.Lesson {
	var out []*plan.Lesson
	for _, b := range st.Blocks {
		for _, th := range b.Themes {
			out = append(out, th.Lessons...)
		}
		if b.Run != nil {
			out = append(out, b.Run)
		}
	}
	return out
}

func pctNeed(total, pct int) int { return (total*pct + 99) / 100 }

// paintingsOf — все 28 картин этапов с отметкой «открыта» и датой.
func (a *App) paintingsOf(in *stats.Input) []PaintingDTO {
	out := []PaintingDTO{}
	for _, st := range a.plan.Stages {
		ls := stageLessons(st)
		var done []time.Time // нулевое время — пройдено импортом
		for _, l := range ls {
			if r, ok := in.Lessons[l.ID]; ok && r.Status == "done" {
				if r.Imported || !r.HasDone() {
					done = append(done, time.Time{})
				} else {
					done = append(done, r.DoneAt)
				}
			}
		}
		sort.Slice(done, func(i, j int) bool { return done[i].Before(done[j]) })
		for _, pct := range galleryPcts {
			p := PaintingDTO{ID: paintingID(st.Num, pct), Num: st.Num, Pct: pct, Title: stageShort(st.Title)}
			var at time.Time
			if pct == 100 {
				at, p.Unlocked = in.StageClosedAt(st)
			} else if need := pctNeed(len(ls), pct); need > 0 && len(done) >= need {
				p.Unlocked, at = true, done[need-1]
			}
			if p.Unlocked && !at.IsZero() {
				d := stats.ParseDay(in.DayLabel(at))
				p.Date, p.When = d.Format("2006-01-02"), dateGen(d)
			}
			out = append(out, p)
		}
	}
	return out
}

// Gallery — картины этапов: какие открыты и когда.
func (a *App) Gallery() ([]PaintingDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return nil, err
	}
	return a.paintingsOf(s.in), nil
}

// newPaintings — картины, открывшиеся между двумя снимками (для окна «Новая картина»).
func (a *App) newPaintings(before, after *snap) []PaintingDTO {
	was := map[string]bool{}
	for _, p := range a.paintingsOf(before.in) {
		was[p.ID] = p.Unlocked
	}
	out := []PaintingDTO{}
	for _, p := range a.paintingsOf(after.in) {
		if p.Unlocked && !was[p.ID] {
			out = append(out, p)
		}
	}
	return out
}

// SavePainting сохраняет картину (PNG data URL) в подпапку «Галерея» папки экспорта и возвращает путь файла.
func (a *App) SavePainting(name, image string) (string, error) {
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
	dir := filepath.Join(root, "Галерея")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	base := safeName(name)
	if base == "" {
		base = "Картина"
	}
	file := filepath.Join(dir, base+".png")
	for i := 2; ; i++ { // повторное сохранение не затирает прежний файл
		if _, err := os.Stat(file); os.IsNotExist(err) {
			break
		}
		file = filepath.Join(dir, fmt.Sprintf("%s (%d).png", base, i))
	}
	tmp := filepath.Join(dir, ".tmp-painting")
	if err := os.MkdirAll(tmp, 0o755); err != nil {
		return "", err
	}
	defer os.RemoveAll(tmp)
	if err := writeImages(tmp, nil, []string{image}); err != nil {
		return "", err
	}
	if err := os.Rename(filepath.Join(tmp, "01.png"), file); err != nil {
		return "", err
	}
	return file, nil
}
