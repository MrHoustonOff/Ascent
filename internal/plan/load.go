package plan

import (
	"embed"
	"io/fs"
	"os"
)

//go:embed data/*.md
var embedded embed.FS

// Embedded возвращает файловую систему со встроенным планом.
func Embedded() fs.FS {
	sub, _ := fs.Sub(embedded, "data")
	return sub
}

// LoadEmbedded разбирает встроенный план.
func LoadEmbedded() (*Plan, error) { return Parse(Embedded()) }

// LoadDir разбирает план из папки на диске.
func LoadDir(dir string) (*Plan, error) { return Parse(os.DirFS(dir)) }
