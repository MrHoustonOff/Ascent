package app

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

// ---------- комментарии к урокам и темам ----------

// CommentDTO — комментарий с данными цели для страницы «Комментарии» (фильтры, группировка, порядок по плану).
type CommentDTO struct {
	ID         int64  `json:"id"`
	Target     string `json:"target"` // ID урока или темы
	Kind       string `json:"kind"`   // lesson | theme
	Title      string `json:"title"`  // название урока или темы
	ThemeID    string `json:"themeId"`
	Theme      string `json:"theme"`
	BlockID    string `json:"blockId"`
	Block      string `json:"block"`
	Stage      int    `json:"stage"`
	StageTitle string `json:"stageTitle"`
	Ord        int    `json:"ord"` // место в плане: для сортировки «по плану»
	Text       string `json:"text"`
	Done       bool   `json:"done"`
	Created    string `json:"created"` // YYYY-MM-DD; пусто — перенесён из старых («раньше»)
	Ts         int64  `json:"ts"`      // время создания, unix; 0 — старый
}

func (a *App) commentDTO(id int64, target, text string, done bool, created time.Time) CommentDTO {
	d := CommentDTO{ID: id, Target: target, Text: text, Done: done, Ord: 1 << 30}
	if !created.IsZero() {
		d.Created = created.In(a.Loc).Format("2006-01-02")
		d.Ts = created.Unix()
	}
	ord := map[string]int{}
	for i, lid := range a.plan.Order {
		ord[lid] = i
	}
	if l := a.plan.Lessons[target]; l != nil {
		d.Kind, d.Title, d.ThemeID, d.BlockID, d.Stage, d.Ord = "lesson", strings.ReplaceAll(l.Title, "`", ""), l.Theme, l.Block, l.Stage, ord[target]
	} else if th := a.plan.Themes[target]; th != nil {
		d.Kind, d.Title, d.ThemeID, d.BlockID, d.Stage = "theme", strings.ReplaceAll(th.Title, "`", ""), th.ID, th.Block, th.Stage
		if len(th.Lessons) > 0 {
			d.Ord = ord[th.Lessons[0].ID] // тема — перед своими уроками
			d.Ord--
		}
	}
	if th := a.plan.Themes[d.ThemeID]; th != nil {
		d.Theme = strings.ReplaceAll(th.Title, "`", "")
	}
	if b := a.plan.Blocks[d.BlockID]; b != nil {
		d.Block = strings.ReplaceAll(b.Title, "`", "")
	}
	if st := a.stageByNum(d.Stage); st != nil {
		d.StageTitle = st.Title
	}
	return d
}

// Comments — все комментарии (старые и новые) в порядке добавления; фильтры и сортировка — на странице.
func (a *App) Comments() ([]CommentDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	all, err := a.st.Comments()
	if err != nil {
		return nil, err
	}
	out := []CommentDTO{}
	for _, c := range all {
		out = append(out, a.commentDTO(c.ID, c.Target, c.Text, c.Done, c.Created))
	}
	return out, nil
}

// CommentsFor — комментарии одного урока или темы: старые («раньше») сначала, затем по времени.
func (a *App) CommentsFor(target string) ([]CommentDTO, error) {
	all, err := a.Comments()
	if err != nil {
		return nil, err
	}
	out := []CommentDTO{}
	for _, c := range all {
		if c.Target == target {
			out = append(out, c)
		}
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].Ts < out[j].Ts })
	return out, nil
}

func (a *App) checkTarget(target string) error {
	if a.plan.Lessons[target] == nil && a.plan.Themes[target] == nil {
		return fmt.Errorf("нет урока или темы %s", target)
	}
	return nil
}

func (a *App) AddComment(target, text string) (CommentDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if err := a.checkTarget(target); err != nil {
		return CommentDTO{}, err
	}
	if strings.TrimSpace(text) == "" {
		return CommentDTO{}, fmt.Errorf("пустой комментарий")
	}
	id, err := a.st.AddComment(target, text)
	if err != nil {
		return CommentDTO{}, err
	}
	return a.commentDTO(id, target, strings.TrimSpace(text), false, a.Now()), nil
}

func (a *App) UpdateComment(id int64, text string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if strings.TrimSpace(text) == "" {
		return a.st.DeleteComment(id) // стёр текст — комментария нет
	}
	return a.st.UpdateComment(id, text)
}

func (a *App) SetCommentDone(id int64, done bool) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.st.SetCommentDone(id, done)
}

func (a *App) DeleteComment(id int64) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.st.DeleteComment(id)
}

// ThemeComments — комментарии тем для итогов: id темы → тексты по порядку.
func (a *App) ThemeComments() (map[string][]string, error) {
	all, err := a.Comments()
	if err != nil {
		return nil, err
	}
	sort.SliceStable(all, func(i, j int) bool { return all[i].Ts < all[j].Ts })
	out := map[string][]string{}
	for _, c := range all {
		if c.Kind == "theme" {
			out[c.Target] = append(out[c.Target], c.Text)
		}
	}
	return out, nil
}
