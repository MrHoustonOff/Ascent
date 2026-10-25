// Package plan разбирает файлы плана «Go — ROADMAP» в модель в памяти.
package plan

import "strings"

type Plan struct {
	Version string // sha256 всех md-файлов, первые 12 символов
	Stages  []*Stage
	Blocks  map[string]*Block
	Themes  map[string]*Theme
	Lessons map[string]*Lesson
	Order   []string // ID всех уроков (вкл. прогоны и проект) в порядке файлов
	Bank    []*BankQ
	Sources map[string]Source
	Terms   []*Term
	Docs    map[string]string // "00","98","99" -> исходный markdown
	// DocTitles — имена файлов плана по числовому префиксу, для вики-ссылок.
	DocNames map[string]string
}

type Stage struct {
	Num    int
	Title  string
	Intro  []string
	Blocks []*Block
}

type Block struct {
	ID, Title, Why string
	Deps           []string
	Stage          int
	Themes         []*Theme
	Run            *Lesson
}

type Theme struct {
	ID, Title string
	Brief     []string
	Block     string
	Stage     int
	Lessons   []*Lesson
	Checks    []string
}

type Lesson struct {
	ID, Title    string
	Stars        int
	Kind         string // lesson | run | project
	Arrows       []Arrow
	Theme, Block string
	Stage, Ord   int
}

type Arrow struct {
	Kind, Text string
	IDs        []string
}

type BankQ struct {
	Block   string
	Stage   int
	Text    string
	Marker  bool
	Lessons []string
	Sources []string
	Ord     int
}

type Term struct {
	Name, Ref, Pattern, Block string
	Stage                     int
}

type Source struct{ Title, URL string }

// IsRun сообщает, что ID — прогон этапа.
func IsRunID(id string) bool { return strings.HasPrefix(id, "ПРОГОН-") }
