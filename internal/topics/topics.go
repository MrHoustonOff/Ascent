// Package topics — общие темы уроков: как тему урока называют в документации, статьях и видео.
// Это ориентир, с чего начать: алиас урока, сам урок, его номер и вопросы не меняются.
//
// Формат файлов data/*.tsv, по строке на тему (у урока их 1–3):
//
//	ID урока <TAB> Русское название / English name <TAB> ссылки через пробел
//
// Ссылки — только на официальную документацию и только проверенные. «?» вместо темы — урок без
// общепринятого названия: темы у него нет. Строки с # — комментарии.
package topics

import (
	"bufio"
	"embed"
	"fmt"
	"io/fs"
	"sort"
	"strings"
)

//go:embed data/*.tsv
var embedded embed.FS

// Embedded — встроенные общие темы.
func Embedded() fs.FS { sub, _ := fs.Sub(embedded, "data"); return sub }

type Topic struct {
	RU, EN string
	Links  []string
}

// Parse читает все *.tsv из fsys: id урока → общие темы (в порядке файла).
func Parse(fsys fs.FS) (map[string][]Topic, error) {
	names, err := fs.Glob(fsys, "*.tsv")
	if err != nil {
		return nil, err
	}
	sort.Strings(names)
	out := map[string][]Topic{}
	for _, n := range names {
		f, err := fsys.Open(n)
		if err != nil {
			return nil, err
		}
		sc := bufio.NewScanner(f)
		for ln := 1; sc.Scan(); ln++ {
			line := strings.TrimSpace(sc.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.Split(line, "\t")
			if len(parts) < 2 {
				f.Close()
				return nil, fmt.Errorf("%s:%d: ожидается «id<TAB>тема»", n, ln)
			}
			id, name := strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
			if name == "?" {
				continue
			}
			ru, en, ok := strings.Cut(name, " / ")
			if !ok {
				f.Close()
				return nil, fmt.Errorf("%s:%d: тема без « / »: %q", n, ln, name)
			}
			t := Topic{RU: strings.TrimSpace(ru), EN: strings.TrimSpace(en)}
			if len(parts) > 2 {
				t.Links = strings.Fields(parts[2])
			}
			out[id] = append(out[id], t)
		}
		f.Close()
		if err := sc.Err(); err != nil {
			return nil, err
		}
	}
	return out, nil
}
