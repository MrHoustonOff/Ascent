package plan

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io/fs"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

const ID = `[A-ZА-ЯЁ]+-\d+(?:\.\d+){0,2}`

var (
	reStage     = regexp.MustCompile(`^# Этап (\d+)\. (.+)$`)
	reBlock     = regexp.MustCompile(`^## (` + ID + `)\. (.+)$`)
	reDeps      = regexp.MustCompile(`^\*стоит на: (.*)\*\s*$`)
	reWhy       = regexp.MustCompile(`^\*Зачем: (.*)\*\s*$`)
	reTheme     = regexp.MustCompile(`^### (` + ID + `) (.+)$`)
	reLesson    = regexp.MustCompile(`^- \[[ xX]\] \*\*(` + ID + `)\*\* (.*?)(?:\s+(★+))?\s*$`)
	reArrow     = regexp.MustCompile(`^\s+↳ ([^:]+): (.*)$`)
	reCheckHead = regexp.MustCompile(`^\*\*Должен уметь ответить:\*\*\s*$`)
	reCheck     = regexp.MustCompile(`^- \[[ xX]\] (.+)$`)
	reIDs       = regexp.MustCompile(ID)

	reBankStage = regexp.MustCompile(`^# Этап (\d+)`)
	reBankBlock = regexp.MustCompile(`^## (` + ID + `)\s*$`)
	reSource    = regexp.MustCompile(`\[[^\]]+\]`)
	reSrcLine   = regexp.MustCompile(`^- \*\*(\[[^\]]+\])\*\*\s+\[([^\]]+)\]\((https?://[^)]+)\)`)

	reTerm      = regexp.MustCompile("^- \\*\\*(.+?)\\*\\* — (.+?) · `(.+)`\\s*$")
	reGlStage   = regexp.MustCompile(`^## Этап (\d+)`)
	reGlBlock   = regexp.MustCompile(`^### (` + ID + `)`)
	reFilePrefx = regexp.MustCompile(`^(\d\d)[ _].+\.md$`)
)

// Parse читает все md-файлы из fsys и строит модель.
func Parse(fsys fs.FS) (*Plan, error) {
	entries, err := fs.ReadDir(fsys, ".")
	if err != nil {
		return nil, err
	}
	files := map[string]string{} // префикс -> имя файла
	var names []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := reFilePrefx.FindStringSubmatch(e.Name())
		if m == nil {
			continue
		}
		files[m[1]] = e.Name()
		names = append(names, e.Name())
	}
	sort.Strings(names)
	if len(files["01"]) == 0 {
		return nil, errors.New("в папке нет файлов этапов")
	}

	p := &Plan{
		Blocks:   map[string]*Block{},
		Themes:   map[string]*Theme{},
		Lessons:  map[string]*Lesson{},
		Sources:  map[string]Source{},
		Docs:     map[string]string{},
		DocNames: map[string]string{},
	}
	h := sha256.New()
	content := map[string]string{}
	for _, n := range names {
		b, err := fs.ReadFile(fsys, n)
		if err != nil {
			return nil, err
		}
		h.Write([]byte(n))
		h.Write(b)
		content[n] = strings.ReplaceAll(string(b), "\r\n", "\n")
	}
	p.Version = hex.EncodeToString(h.Sum(nil))[:12]
	for k, n := range files {
		p.DocNames[k] = strings.ReplaceAll(strings.TrimSuffix(n, ".md"), "_", " ")
	}

	for i := 1; i <= 7; i++ {
		k := fmt.Sprintf("%02d", i)
		n, ok := files[k]
		if !ok {
			continue
		}
		if err := p.parseStage(content[n]); err != nil {
			return nil, fmt.Errorf("%s: %w", n, err)
		}
	}
	if n, ok := files["90"]; ok {
		p.parseBank(content[n])
	}
	if n, ok := files["91"]; ok {
		p.parseGlossary(content[n])
	}
	for _, k := range []string{"00", "98", "99"} {
		if n, ok := files[k]; ok {
			p.Docs[k] = content[n]
		}
	}
	return p, nil
}

func stripFrontmatter(lines []string) []string {
	if len(lines) > 0 && strings.TrimSpace(lines[0]) == "---" {
		for i := 1; i < len(lines); i++ {
			if strings.TrimSpace(lines[i]) == "---" {
				return lines[i+1:]
			}
		}
	}
	return lines
}

func quote(s string) (string, bool) {
	if s == ">" {
		return "", true
	}
	if strings.HasPrefix(s, "> ") {
		return s[2:], true
	}
	return "", false
}

func (p *Plan) parseStage(src string) error {
	lines := stripFrontmatter(strings.Split(src, "\n"))
	var (
		st     *Stage
		blk    *Block
		th     *Theme
		last   *Lesson
		inHead = true // вступление этапа
		inBr   bool   // бриф темы
		inChk  bool
	)
	for _, ln := range lines {
		ln = strings.TrimRight(ln, " \t\r")
		if m := reStage.FindStringSubmatch(ln); m != nil {
			n, _ := strconv.Atoi(m[1])
			st = &Stage{Num: n, Title: m[2]}
			p.Stages = append(p.Stages, st)
			inHead = true
			continue
		}
		if st == nil {
			continue
		}
		if m := reBlock.FindStringSubmatch(ln); m != nil {
			blk = &Block{ID: m[1], Title: m[2], Stage: st.Num}
			st.Blocks = append(st.Blocks, blk)
			p.Blocks[blk.ID] = blk
			th, last = nil, nil
			inHead, inBr, inChk = false, false, false
			continue
		}
		if inHead {
			if t, ok := quote(ln); ok {
				st.Intro = append(st.Intro, t)
			}
			continue
		}
		if blk == nil {
			continue
		}
		if m := reDeps.FindStringSubmatch(ln); m != nil {
			blk.Deps = reIDs.FindAllString(m[1], -1)
			continue
		}
		if m := reWhy.FindStringSubmatch(ln); m != nil {
			blk.Why = m[1]
			continue
		}
		if m := reTheme.FindStringSubmatch(ln); m != nil {
			th = &Theme{ID: m[1], Title: m[2], Block: blk.ID, Stage: st.Num}
			blk.Themes = append(blk.Themes, th)
			p.Themes[th.ID] = th
			last = nil
			inBr, inChk = true, false
			continue
		}
		if m := reLesson.FindStringSubmatch(ln); m != nil {
			l := &Lesson{ID: m[1], Title: m[2], Stars: len([]rune(m[3])), Block: blk.ID, Stage: st.Num, Ord: len(p.Order)}
			switch {
			case IsRunID(l.ID):
				l.Kind = "run"
				blk.Run = l
			case l.ID == "СБОР-1.2.1":
				l.Kind = "project"
			default:
				l.Kind = "lesson"
			}
			if th != nil && l.Kind != "run" {
				l.Theme = th.ID
				th.Lessons = append(th.Lessons, l)
			}
			p.Lessons[l.ID] = l
			p.Order = append(p.Order, l.ID)
			last = l
			inBr, inChk = false, false
			continue
		}
		if m := reArrow.FindStringSubmatch(ln); m != nil && last != nil {
			a := Arrow{Kind: strings.TrimSpace(m[1]), Text: m[2]}
			if a.Kind == "стоит на" {
				a.IDs = reIDs.FindAllString(m[2], -1)
			}
			last.Arrows = append(last.Arrows, a)
			continue
		}
		if reCheckHead.MatchString(ln) {
			inChk, inBr = true, false
			continue
		}
		if inChk && th != nil {
			if m := reCheck.FindStringSubmatch(ln); m != nil {
				th.Checks = append(th.Checks, m[1])
				continue
			}
		}
		if inBr && th != nil {
			if t, ok := quote(ln); ok {
				th.Brief = append(th.Brief, t)
			}
		}
	}
	return nil
}

func (p *Plan) parseBank(src string) {
	lines := stripFrontmatter(strings.Split(src, "\n"))
	stage, block, inSources := 0, "", false
	for _, ln := range lines {
		ln = strings.TrimRight(ln, " \t\r")
		if strings.HasPrefix(ln, "## Источники") {
			inSources, block = true, ""
			continue
		}
		if m := reBankStage.FindStringSubmatch(ln); m != nil {
			stage, _ = strconv.Atoi(m[1])
			inSources = false
			continue
		}
		if m := reBankBlock.FindStringSubmatch(ln); m != nil {
			block, inSources = m[1], false
			continue
		}
		if m := reSrcLine.FindStringSubmatch(ln); m != nil {
			p.Sources[m[1]] = Source{Title: m[2], URL: m[3]}
			continue
		}
		if inSources || block == "" || !strings.HasPrefix(ln, "- ") || !strings.Contains(ln, "→") {
			continue
		}
		body := strings.TrimPrefix(ln, "- ")
		marker := strings.HasPrefix(body, "◆ ")
		body = strings.TrimPrefix(body, "◆ ")
		text, rest, ok := strings.Cut(body, " → ")
		if !ok {
			continue
		}
		q := &BankQ{Block: block, Stage: stage, Text: strings.TrimSpace(text), Marker: marker, Ord: len(p.Bank)}
		if i := strings.LastIndex(rest, " · "); i >= 0 {
			q.Lessons = reIDs.FindAllString(rest[:i], -1)
			q.Sources = reSource.FindAllString(rest[i+len(" · "):], -1)
		} else {
			q.Lessons = reIDs.FindAllString(rest, -1)
		}
		if b := p.Blocks[block]; b != nil && q.Stage == 0 {
			q.Stage = b.Stage
		}
		p.Bank = append(p.Bank, q)
	}
	// источники без ссылок — пояснения
	for _, k := range []string{"[—]", "[Л]"} {
		if _, ok := p.Sources[k]; !ok {
			if k == "[—]" {
				p.Sources[k] = Source{Title: "Типовой вопрос: добавлен по устройству темы"}
			} else {
				p.Sources[k] = Source{Title: "Известная ловушка «что выведет код» или «найди баг»"}
			}
		}
	}
}

func (p *Plan) parseGlossary(src string) {
	lines := stripFrontmatter(strings.Split(src, "\n"))
	stage, block := 0, ""
	for _, ln := range lines {
		ln = strings.TrimRight(ln, " \t\r")
		if m := reGlStage.FindStringSubmatch(ln); m != nil {
			stage, _ = strconv.Atoi(m[1])
			continue
		}
		if m := reGlBlock.FindStringSubmatch(ln); m != nil {
			block = m[1]
			continue
		}
		if m := reTerm.FindStringSubmatch(ln); m != nil {
			p.Terms = append(p.Terms, &Term{Name: m[1], Ref: m[2], Pattern: m[3], Block: block, Stage: stage})
		}
	}
}

// Markers возвращает маркеры ◆ блока в порядке файла.
func (p *Plan) Markers(block string) []*BankQ {
	var r []*BankQ
	for _, q := range p.Bank {
		if q.Block == block && q.Marker {
			r = append(r, q)
		}
	}
	return r
}

// StageMarkers возвращает все маркеры ◆ этапа.
func (p *Plan) StageMarkers(stage int) []*BankQ {
	var r []*BankQ
	for _, q := range p.Bank {
		if q.Marker && q.Stage == stage {
			r = append(r, q)
		}
	}
	return r
}

// Rewrite возвращает копии md-файлов, где у пройденных уроков и отмеченных вопросов стоит [x].
// Исходные файлы не меняются.
func Rewrite(fsys fs.FS, lessonDone func(id string) bool, checkDone func(theme, text string) bool) (map[string]string, error) {
	entries, err := fs.ReadDir(fsys, ".")
	if err != nil {
		return nil, err
	}
	out := map[string]string{}
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		b, err := fs.ReadFile(fsys, e.Name())
		if err != nil {
			return nil, err
		}
		lines := strings.Split(string(b), "\n")
		theme := ""
		for i, ln := range lines {
			t := strings.TrimRight(ln, "\r")
			if m := reTheme.FindStringSubmatch(t); m != nil {
				theme = m[1]
			} else if reBlock.MatchString(t) {
				theme = ""
			}
			if m := reLesson.FindStringSubmatch(t); m != nil {
				lines[i] = setBox(ln, lessonDone(m[1]))
				continue
			}
			if theme != "" {
				if m := reCheck.FindStringSubmatch(t); m != nil {
					lines[i] = setBox(ln, checkDone(theme, m[1]))
				}
			}
		}
		out[e.Name()] = strings.Join(lines, "\n")
	}
	return out, nil
}

func setBox(ln string, done bool) string {
	box := "- [ ]"
	if done {
		box = "- [x]"
	}
	if strings.HasPrefix(ln, "- [") && len(ln) >= 5 {
		return box + ln[5:]
	}
	return ln
}
