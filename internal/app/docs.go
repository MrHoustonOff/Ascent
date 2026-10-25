package app

import (
	"bytes"
	"html"
	"regexp"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	gmhtml "github.com/yuin/goldmark/renderer/html"

	"ascent/internal/plan"
)

var (
	reWiki     = regexp.MustCompile(`\[\[([^\]#|]+?)(?:#([^\]|]+?))?(?:\|([^\]]+?))?\]\]`)
	reIDText   = regexp.MustCompile(plan.ID)
	reTagSplit = regexp.MustCompile(`(<[^>]+>)`)
	reFront    = regexp.MustCompile(`(?s)\A---\n.*?\n---\n`)
)

var md = goldmark.New(
	goldmark.WithExtensions(extension.Table, extension.Strikethrough),
	goldmark.WithRendererOptions(gmhtml.WithUnsafe()),
)

// docPrefix — две цифры в начале имени файла: «01 Этап 1 — Основы» → 01.
func docPrefix(name string) string {
	name = strings.TrimSpace(name)
	if len(name) >= 2 && name[0] >= '0' && name[0] <= '9' && name[1] >= '0' && name[1] <= '9' {
		return name[:2]
	}
	return ""
}

// RenderDoc превращает markdown документа в HTML: вики-ссылки и ID становятся ссылками.
func RenderDoc(p *plan.Plan, src string) string {
	src = reFront.ReplaceAllString(strings.ReplaceAll(src, "\r\n", "\n"), "")
	src = reWiki.ReplaceAllStringFunc(src, func(m string) string {
		g := reWiki.FindStringSubmatch(m)
		label := g[1]
		if g[3] != "" {
			label = g[3]
		}
		pre := docPrefix(g[1])
		if pre == "" {
			return html.EscapeString(label)
		}
		// «98 ТЗ А — Распродажа…» — полное имя в тексте ссылки
		return `<a data-doc="` + pre + `" data-anchor="` + html.EscapeString(g[2]) + `">` + html.EscapeString(label) + `</a>`
	})
	var buf bytes.Buffer
	if err := md.Convert([]byte(src), &buf); err != nil {
		return "<p>" + html.EscapeString(src) + "</p>"
	}
	return linkIDs(p, buf.String())
}

// linkIDs оборачивает ID уроков, тем и блоков в ссылки — только в текстовых узлах вне a/code/pre.
func linkIDs(p *plan.Plan, h string) string {
	parts := reTagSplit.Split(h, -1)
	tags := reTagSplit.FindAllString(h, -1)
	var b strings.Builder
	skip := 0
	for i, txt := range parts {
		if skip == 0 {
			txt = reIDText.ReplaceAllStringFunc(txt, func(id string) string {
				if p.Lessons[id] != nil || p.Themes[id] != nil || p.Blocks[id] != nil {
					return `<a data-goto="` + id + `">` + id + `</a>`
				}
				return id
			})
		}
		b.WriteString(txt)
		if i < len(tags) {
			t := tags[i]
			lt := strings.ToLower(t)
			for _, n := range []string{"a", "code", "pre"} {
				if strings.HasPrefix(lt, "<"+n+" ") || lt == "<"+n+">" {
					skip++
				} else if lt == "</"+n+">" && skip > 0 {
					skip--
				}
			}
			b.WriteString(t)
		}
	}
	return b.String()
}

type DocDTO struct {
	Key   string `json:"key"`
	Title string `json:"title"`
	HTML  string `json:"html"`
}

var docTitles = map[string]string{"00": "Карта", "98": "ТЗ А — Распродажа без перепродажи", "99": "ТЗ Б — Доставка вебхуков"}

func (a *App) Doc(key string) (DocDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	src, ok := a.plan.Docs[key]
	if !ok {
		return DocDTO{}, errNotFound(key)
	}
	return DocDTO{Key: key, Title: docTitles[key], HTML: RenderDoc(a.plan, src)}, nil
}

// Docs — список документов.
func (a *App) Docs() []DocDTO {
	out := []DocDTO{}
	for _, k := range []string{"00", "98", "99"} {
		if _, ok := a.plan.Docs[k]; ok {
			out = append(out, DocDTO{Key: k, Title: docTitles[k]})
		}
	}
	return out
}
