package topics

import (
	"testing"
	"testing/fstest"
)

func TestParse(t *testing.T) {
	fsys := fstest.MapFS{"a.tsv": {Data: []byte("# комментарий\nGO-1.2.4\tПакет fmt / fmt package\thttps://pkg.go.dev/fmt https://pkg.go.dev/fmt#Printf\nGO-1.2.4\tФорматированный вывод / formatted I/O\nGO-1.1.1\t?\n")}}
	m, err := Parse(fsys)
	if err != nil || len(m["GO-1.2.4"]) != 2 || len(m["GO-1.2.4"][0].Links) != 2 || m["GO-1.2.4"][1].EN != "formatted I/O" || len(m["GO-1.1.1"]) != 0 {
		t.Fatalf("%v %+v", err, m)
	}
	if _, err := Parse(fstest.MapFS{"b.tsv": {Data: []byte("X\tбез разделителя\n")}}); err == nil {
		t.Fatal("тема без « / » должна быть ошибкой")
	}
}

// встроенные данные: разбираются, у каждого урока не больше трёх тем, ссылки — https
func TestEmbedded(t *testing.T) {
	m, err := Parse(Embedded())
	if err != nil {
		t.Fatal(err)
	}
	for id, ts := range m {
		if len(ts) > 3 {
			t.Errorf("%s: %d тем, нужно не больше 3", id, len(ts))
		}
		for _, x := range ts {
			for _, l := range x.Links {
				if len(l) < 9 || l[:8] != "https://" {
					t.Errorf("%s: ссылка %q", id, l)
				}
			}
		}
	}
}
