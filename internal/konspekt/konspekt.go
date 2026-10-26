// Package konspekt разбирает конспекты уроков: вопросы для поиска ответа, что гуглить,
// что должен знать, термины, границу и «позже». Файлы — по одному на блок, в том же
// markdown-стиле, что и план (их можно читать и править в Obsidian).
package konspekt

import (
	"crypto/sha1"
	"embed"
	"encoding/hex"
	"io/fs"
	"regexp"
	"sort"
	"strings"
)

//go:embed data/*.md
var embedded embed.FS

// Embedded возвращает файловую систему со встроенными конспектами.
func Embedded() fs.FS {
	sub, _ := fs.Sub(embedded, "data")
	return sub
}

type Lesson struct {
	ID     string
	Qs     []Question
	Google []string
	Know   []string // абзацы
	Terms  []Term
	Border string
	Later  []Later
}

type Question struct {
	Key   string // ID урока + хеш текста: отметка переживает перестановку вопросов
	Text  string
	Query string   // запрос для поиска (без обратных кавычек)
	Refs  []string // ID уроков (у вопросов прогона)
}

type Term struct {
	Name, Desc string
	New        bool
}

// Later — «описание — ID, ID».
type Later struct {
	Text string
	IDs  []string
}

const id = `[A-ZА-ЯЁ]+-\d+(?:\.\d+){0,2}`

var (
	reLesson = regexp.MustCompile(`^#### (` + id + `)(?:\s|$)`)
	reQ      = regexp.MustCompile(`^- \[[ xX]\] (.+)$`)
	reQuery  = regexp.MustCompile("^(.*?) · `([^`]+)`\\s*$")
	reRefs   = regexp.MustCompile(`^(.*?) · (` + id + `(?:, ` + id + `)*)\s*$`)
	reCode   = regexp.MustCompile("`([^`]+)`")
	reTerm   = regexp.MustCompile(`^- \*\*(.+?)\*\*(\s*\*\(новое\)\*)?\s*—\s*(.+)$`)
	reIDs    = regexp.MustCompile(id)
	reFile   = regexp.MustCompile(`^\d\d-\d\d[ _].+\.md$`)
)

// Parse читает все файлы конспектов из fsys.
func Parse(fsys fs.FS) (map[string]*Lesson, error) {
	ents, err := fs.ReadDir(fsys, ".")
	if err != nil {
		return nil, err
	}
	var names []string
	for _, e := range ents {
		if !e.IsDir() && reFile.MatchString(e.Name()) {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)
	out := map[string]*Lesson{}
	for _, n := range names {
		b, err := fs.ReadFile(fsys, n)
		if err != nil {
			return nil, err
		}
		parseFile(string(b), out)
	}
	return out, nil
}

func parseFile(src string, out map[string]*Lesson) {
	var cur *Lesson
	sec := ""
	for _, line := range strings.Split(strings.ReplaceAll(src, "\r\n", "\n"), "\n") {
		line = strings.TrimRight(line, " \t")
		if strings.HasPrefix(line, "#") {
			cur, sec = nil, ""
			if m := reLesson.FindStringSubmatch(line); m != nil {
				cur = &Lesson{ID: m[1]}
				out[cur.ID] = cur
			}
			continue
		}
		if cur == nil || line == "" {
			continue
		}
		switch {
		case line == "**Вопросы**":
			sec = "q"
			continue
		case line == "**Должен знать**":
			sec = "know"
			continue
		case line == "**Термины**":
			sec = "terms"
			continue
		case strings.HasPrefix(line, "**Гуглить:**"):
			for _, m := range reCode.FindAllStringSubmatch(line, -1) {
				cur.Google = append(cur.Google, m[1])
			}
			sec = ""
			continue
		case strings.HasPrefix(line, "**Граница:**"):
			cur.Border = strings.TrimSpace(strings.TrimPrefix(line, "**Граница:**"))
			sec = ""
			continue
		case strings.HasPrefix(line, "**Позже:**"):
			cur.Later = parseLater(strings.TrimSpace(strings.TrimPrefix(line, "**Позже:**")))
			sec = ""
			continue
		}
		switch sec {
		case "q":
			if m := reQ.FindStringSubmatch(line); m != nil {
				cur.Qs = append(cur.Qs, parseQ(cur.ID, m[1]))
			}
		case "know":
			cur.Know = append(cur.Know, line)
		case "terms":
			if m := reTerm.FindStringSubmatch(line); m != nil {
				cur.Terms = append(cur.Terms, Term{Name: m[1], New: m[2] != "", Desc: m[3]})
			}
		}
	}
}

func parseQ(lesson, s string) Question {
	q := Question{Text: s}
	if m := reQuery.FindStringSubmatch(s); m != nil {
		q.Text, q.Query = m[1], m[2]
	} else if m := reRefs.FindStringSubmatch(s); m != nil {
		q.Text, q.Refs = m[1], strings.Split(m[2], ", ")
	}
	h := sha1.Sum([]byte(q.Text))
	q.Key = lesson + "#" + hex.EncodeToString(h[:])[:10]
	return q
}

// «описание — ID; описание — ID, ID.» → части. Части без ID остаются текстом.
func parseLater(s string) []Later {
	s = strings.TrimSuffix(s, ".")
	var out []Later
	for _, part := range strings.Split(s, "; ") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		l := Later{Text: part}
		if i := strings.LastIndex(part, " — "); i >= 0 {
			tail := part[i+len(" — "):]
			if ids := reIDs.FindAllString(tail, -1); len(ids) > 0 && strings.Trim(strings.ReplaceAll(reIDs.ReplaceAllString(tail, ""), " и ", ""), ", .") == "" {
				l.Text, l.IDs = part[:i], ids
			}
		}
		out = append(out, l)
	}
	return out
}
