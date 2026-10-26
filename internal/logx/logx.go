// Package logx — простой лог в файл с ротацией: до 5 файлов по 1 МБ.
package logx

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const (
	maxSize  = 1 << 20
	maxFiles = 5
)

type Logger struct {
	mu   sync.Mutex
	path string
	f    *os.File
	size int64
}

func Open(dir string) (*Logger, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	l := &Logger{path: filepath.Join(dir, "ascent.log")}
	return l, l.open()
}

func (l *Logger) open() error {
	f, err := os.OpenFile(l.path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return err
	}
	st, _ := f.Stat()
	l.f, l.size = f, st.Size()
	return nil
}

func (l *Logger) rotate() {
	l.f.Close()
	os.Remove(fmt.Sprintf("%s.%d", l.path, maxFiles-1))
	for i := maxFiles - 2; i >= 1; i-- {
		os.Rename(fmt.Sprintf("%s.%d", l.path, i), fmt.Sprintf("%s.%d", l.path, i+1))
	}
	os.Rename(l.path, l.path+".1")
	_ = l.open()
}

// Printf пишет строку с временем. Безопасен для вызова из нескольких горутин.
func (l *Logger) Printf(format string, args ...any) {
	if l == nil {
		return
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	line := fmt.Sprintf("%s %s\n", time.Now().Format("2006-01-02 15:04:05"), fmt.Sprintf(format, args...))
	if l.size+int64(len(line)) > maxSize {
		l.rotate()
	}
	n, _ := l.f.WriteString(line)
	l.size += int64(n)
}

func (l *Logger) Close() error {
	if l == nil || l.f == nil {
		return nil
	}
	return l.f.Close()
}
