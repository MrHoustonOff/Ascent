package logx

import (
	"os"
	"strings"
	"testing"
)

func TestRotation(t *testing.T) {
	dir := t.TempDir()
	l, err := Open(dir)
	if err != nil {
		t.Fatal(err)
	}
	defer l.Close()
	line := strings.Repeat("x", 1000)
	for i := 0; i < 8000; i++ {
		l.Printf("%s", line)
	}
	ents, _ := os.ReadDir(dir)
	if len(ents) > 5 {
		t.Fatalf("файлов %d", len(ents))
	}
	st, _ := os.Stat(dir + "/ascent.log")
	if st.Size() > 1<<20+2000 {
		t.Fatalf("размер %d", st.Size())
	}
}
