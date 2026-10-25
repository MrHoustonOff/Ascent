package app

import (
	"fmt"
	"strings"

	"ascent/internal/clip"
	"ascent/internal/plan"
	"ascent/internal/stats"
	"ascent/internal/store"
)

// ---------- карточка «Сегодня» ----------

type ThemeRef struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Done  int    `json:"done"`
	Total int    `json:"total"`
	Pct   int    `json:"pct"`
}

type NextDTO struct {
	// Card: lesson_todo | lesson_doing | theme_check | block_close | stage_run | project | goal_done | all_done
	Card     string      `json:"card"`
	Lesson   *LessonDTO  `json:"lesson"`
	Theme    *ThemeRef   `json:"theme"`
	Block    string      `json:"block"`
	BlockTi  string      `json:"blockTitle"`
	Checks   []CheckDTO  `json:"checks"`
	Markers  []MarkerDTO `json:"markers"`
	NextID   string      `json:"nextId"`
	StageNum int         `json:"stageNum"`
	Total    int         `json:"total"`
}

func (s *snap) themeRef(th *plan.Theme) *ThemeRef {
	d, t := s.themeCounts(th)
	return &ThemeRef{ID: th.ID, Title: th.Title, Done: d, Total: t, Pct: pct(d, t)}
}

func (s *snap) next(skipPending, skipGoal bool) NextDTO {
	p := s.a.plan
	d := NextDTO{Checks: []CheckDTO{}, Markers: []MarkerDTO{}}
	_, d.Total = s.totalCounts()
	// 1. начатый урок
	for _, id := range p.Order {
		if s.status(id) == "doing" {
			d.Card = "lesson_doing"
			l := s.lessonDTO(p.Lessons[id])
			d.Lesson = &l
			if th := p.Themes[l.Theme]; th != nil {
				d.Theme = s.themeRef(th)
			}
			return d
		}
	}
	nl := s.in.NextLesson()
	nextOrd := len(p.Order)
	if nl != nil {
		nextOrd = nl.Ord
		d.NextID = nl.ID
	}
	// 2. цель дня выполнена
	if !skipGoal && s.themesToday() >= s.goal && nl != nil {
		d.Card = "goal_done"
		return d
	}
	// 3. проверка темы / маркеры блока сразу после пройденного
	if !skipPending && nextOrd > 0 {
		prev := p.Lessons[p.Order[nextOrd-1]]
		if prev != nil && prev.Theme != "" {
			th := p.Themes[prev.Theme]
			if th != nil && th.Lessons[len(th.Lessons)-1].ID == prev.ID && s.in.LessonsDone(th) && !s.in.ThemeClosed(th) {
				d.Card = "theme_check"
				d.Theme = s.themeRef(th)
				for i, c := range th.Checks {
					_, ok := s.in.Checks[store.CheckKey(th.ID, c)]
					d.Checks = append(d.Checks, CheckDTO{N: i + 1, Text: c, Done: ok})
				}
				return d
			}
		}
		if prev != nil {
			b := p.Blocks[prev.Block]
			if b != nil && len(b.Themes) > 0 {
				lastTh := b.Themes[len(b.Themes)-1]
				if lastTh.Lessons[len(lastTh.Lessons)-1].ID == prev.ID && !s.in.BlockClosed(b) {
					allThemes := true
					for _, th := range b.Themes {
						if !s.in.ThemeClosed(th) {
							allThemes = false
						}
					}
					if allThemes {
						d.Card, d.Block, d.BlockTi = "block_close", b.ID, b.Title
						d.Markers = s.markerDTOs(b)
						return d
					}
				}
			}
		}
	}
	if nl == nil {
		d.Card = "all_done"
		return d
	}
	l := s.lessonDTO(nl)
	d.Lesson = &l
	d.Block = nl.Block
	if b := p.Blocks[nl.Block]; b != nil {
		d.BlockTi = b.Title
	}
	switch nl.Kind {
	case "run":
		d.Card, d.StageNum = "stage_run", nl.Stage
		for i, q := range p.StageMarkers(nl.Stage) {
			d.Markers = append(d.Markers, s.markerDTO(i+1, q))
		}
	case "project":
		d.Card = "project"
	default:
		d.Card = "lesson_todo"
		if th := p.Themes[nl.Theme]; th != nil {
			d.Theme = s.themeRef(th)
		}
	}
	return d
}

func (a *App) Next(skipPending, skipGoal bool) (NextDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return NextDTO{}, err
	}
	return s.next(skipPending, skipGoal), nil
}

// ---------- события прогресса ----------

type ClosedRef struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type ProgressDTO struct {
	ThemeClosed *ClosedRef `json:"themeClosed"`
	BlockClosed *ClosedRef `json:"blockClosed"`
	GoalReached bool       `json:"goalReached"`
	NextID      string     `json:"nextId"`
}

// diff сравнивает состояние до и после и сообщает, что закрылось.
func (a *App) progressSince(before *snap) ProgressDTO {
	var r ProgressDTO
	after, err := a.snap()
	if err != nil {
		return r
	}
	for _, th := range a.plan.Themes {
		if !before.in.ThemeClosed(th) && after.in.ThemeClosed(th) {
			r.ThemeClosed = &ClosedRef{th.ID, th.Title}
		}
	}
	for _, b := range a.plan.Blocks {
		if len(b.Themes) > 0 && !before.in.BlockClosed(b) && after.in.BlockClosed(b) {
			r.BlockClosed = &ClosedRef{b.ID, b.Title}
		}
	}
	r.GoalReached = before.themesToday() < before.goal && after.themesToday() >= after.goal
	if n := after.in.NextLesson(); n != nil {
		r.NextID = n.ID
	}
	return r
}

func (a *App) lessonOpts(set map[string]string) clip.LessonOpts {
	return clip.LessonOpts{Template: set["hermes_template"], WithBrief: set["hermes_with_brief"] == "1", WithDeps: set["hermes_with_deps"] == "1"}
}

func (a *App) setClip(text string) {
	if a.host != nil {
		if err := a.host.ClipboardSet(text); err != nil {
			a.log("clipboard: %v", err)
		}
	}
}

// StartLesson: doing + копирование текста для Гермеса.
func (a *App) StartLesson(id string) (NextDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return NextDTO{}, err
	}
	if a.plan.Lessons[id] == nil {
		return NextDTO{}, errNotFound(id)
	}
	if err := a.st.StartLesson(id); err != nil {
		return NextDTO{}, err
	}
	if txt, err := clip.Lesson(a.plan, id, a.lessonOpts(s.set)); err == nil {
		a.setClip(txt)
	}
	s2, err := a.snap()
	if err != nil {
		return NextDTO{}, err
	}
	return s2.next(true, true), nil
}

func (a *App) CompleteLesson(id string) (ProgressDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	before, err := a.snap()
	if err != nil {
		return ProgressDTO{}, err
	}
	if a.plan.Lessons[id] == nil {
		return ProgressDTO{}, errNotFound(id)
	}
	if err := a.st.CompleteLesson(id); err != nil {
		return ProgressDTO{}, err
	}
	return a.progressSince(before), nil
}

func (a *App) UndoLesson(id string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.st.UndoLesson(id)
}

func (a *App) SetCheck(themeID string, n int, done bool) (ProgressDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	th := a.plan.Themes[themeID]
	if th == nil || n < 1 || n > len(th.Checks) {
		return ProgressDTO{}, errNotFound(themeID)
	}
	before, err := a.snap()
	if err != nil {
		return ProgressDTO{}, err
	}
	if err := a.st.SetCheck(themeID, store.CheckKey(themeID, th.Checks[n-1]), done); err != nil {
		return ProgressDTO{}, err
	}
	return a.progressSince(before), nil
}

// SetChecksAll отмечает все вопросы темы.
func (a *App) SetChecksAll(themeID string, done bool) (ProgressDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	th := a.plan.Themes[themeID]
	if th == nil {
		return ProgressDTO{}, errNotFound(themeID)
	}
	before, err := a.snap()
	if err != nil {
		return ProgressDTO{}, err
	}
	for _, c := range th.Checks {
		if err := a.st.SetCheck(themeID, store.CheckKey(themeID, c), done); err != nil {
			return ProgressDTO{}, err
		}
	}
	return a.progressSince(before), nil
}

func (a *App) SetMarker(block string, n int, done bool) (ProgressDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	ms := a.plan.Markers(block)
	if n < 1 || n > len(ms) {
		return ProgressDTO{}, errNotFound(block)
	}
	before, err := a.snap()
	if err != nil {
		return ProgressDTO{}, err
	}
	if err := a.st.SetMarker(block, stats.MarkerKey(block, ms[n-1]), done); err != nil {
		return ProgressDTO{}, err
	}
	return a.progressSince(before), nil
}

// MarkDoneUpTo отмечает все уроки до урока id (не включая) как пройденные ранее.
func (a *App) MarkDoneUpTo(id string) (int, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	l := a.plan.Lessons[id]
	if l == nil {
		return 0, errNotFound(id)
	}
	return a.st.MarkDoneUpTo(a.plan.Order[:l.Ord])
}

func (a *App) SetNote(id, text string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.st.SetNote(id, text)
}

func (a *App) RestToday() error {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return err
	}
	if !stats.CanRest(s.in.ActiveDays(), s.in.Rest, s.today, s.in.S.RestPerWeek) {
		return fmt.Errorf("сегодня отдых взять нельзя")
	}
	return a.st.AddRest(s.today.Format("2006-01-02"))
}

// ---------- копирование ----------

// Copy собирает текст, кладёт в буфер и возвращает.
func (a *App) Copy(kind, ref string) (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	s, err := a.snap()
	if err != nil {
		return "", err
	}
	var txt string
	switch kind {
	case "lesson":
		txt, err = clip.Lesson(a.plan, ref, a.lessonOpts(s.set))
	case "theme_start": // бриф и следующий урок темы
		th := a.plan.Themes[ref]
		if th == nil {
			return "", errNotFound(ref)
		}
		id := th.Lessons[0].ID
		for _, l := range th.Lessons {
			if s.status(l.ID) != "done" {
				id = l.ID
				break
			}
		}
		txt, err = clip.Lesson(a.plan, id, clip.LessonOpts{Template: s.set["hermes_template"], WithBrief: true})
	case "theme_check":
		txt, err = clip.ThemeCheck(a.plan, ref)
	case "block_markers":
		txt, err = clip.BlockMarkers(a.plan, ref)
	case "stage_run":
		n := atoi(ref, 1)
		txt = clip.StageRun(a.plan, n)
	case "done_ids":
		done := map[string]bool{}
		for id, l := range s.in.Lessons {
			if l.Status == "done" {
				done[id] = true
			}
		}
		txt = clip.DoneIDs(a.plan, done)
	case "status":
		txt = a.statusText(s)
	case "id":
		txt = ref
	case "term":
		txt = ref
	case "text":
		txt = ref
	case "bank_selected":
		txt = ref
	default:
		return "", fmt.Errorf("неизвестный вид копирования: %s", kind)
	}
	if err != nil {
		return "", err
	}
	a.setClip(txt)
	return txt, nil
}

func (a *App) statusText(s *snap) string {
	done, total := s.totalCounts()
	d := clip.StatusData{Done: done, Total: total, Pct: pct(done, total)}
	if n := s.in.NextLesson(); n != nil {
		d.Stage, d.Current, d.CurrentTitle = n.Stage, n.ID, n.Title
	}
	v, _, _, _ := s.in.Rate()
	d.PacePerDay = num(v)
	d.Streak = stats.CurrentStreak(s.in.ActiveDays(), s.in.Rest, s.today)
	// последние закрытые темы
	type ct struct {
		th *plan.Theme
		at int64
	}
	var cs []ct
	for _, th := range a.plan.Themes {
		if at, ok := s.in.ThemeClosedAt(th); ok {
			cs = append(cs, ct{th, at.Unix()})
		}
	}
	for i := 0; i < len(cs); i++ {
		for j := i + 1; j < len(cs); j++ {
			if cs[j].at > cs[i].at {
				cs[i], cs[j] = cs[j], cs[i]
			}
		}
	}
	for i := 0; i < len(cs) && i < 3; i++ {
		d.LastThemes = append(d.LastThemes, cs[i].th.ID+" "+cs[i].th.Title)
	}
	return clip.Status(d)
}

// CopyBankSelected копирует выбранные вопросы банка для Гермеса.
func (a *App) CopyBank(keys []string) (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	var b strings.Builder
	b.WriteString("Задавай мне эти вопросы с собесов по одному, без подсказок; после каждого ответа скажи, чего не хватило.")
	i := 0
	want := map[string]bool{}
	for _, k := range keys {
		want[k] = true
	}
	for _, q := range a.plan.Bank {
		if want[bankKey(q)] {
			i++
			fmt.Fprintf(&b, "\n%d. %s", i, q.Text)
			if len(q.Lessons) > 0 {
				fmt.Fprintf(&b, " (уроки: %s)", strings.Join(q.Lessons, ", "))
			}
		}
	}
	txt := b.String()
	a.setClip(txt)
	return txt, nil
}

func bankKey(q *plan.BankQ) string { return fmt.Sprintf("%s:%s", q.Block, store.Hash(q.Text)) }
