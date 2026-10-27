// Package store хранит прогресс в SQLite.
package store

import (
	"crypto/sha1"
	"database/sql"
	"embed"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

type Store struct {
	db  *sql.DB
	dir string
	// Now подменяется в тестах.
	Now func() time.Time
}

// Open открывает (и создаёт) базу по пути path. Для ":memory:" — in-memory.
func Open(path string) (*Store, error) {
	dsn := path
	dir := ""
	if path != ":memory:" {
		dir = filepath.Dir(path)
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, err
		}
		dsn = path + "?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)"
	}
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	s := &Store{db: db, dir: dir, Now: time.Now}
	if err := s.migrate(); err != nil {
		db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error { return s.db.Close() }

// Dir — папка данных (пусто для in-memory).
func (s *Store) Dir() string { return s.dir }

func (s *Store) migrate() error {
	var cur int
	var n int
	_ = s.db.QueryRow(`SELECT count(*) FROM sqlite_master WHERE name='schema_version'`).Scan(&n)
	if n > 0 {
		_ = s.db.QueryRow(`SELECT max(version) FROM schema_version`).Scan(&cur)
	}
	ents, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return err
	}
	var names []string
	for _, e := range ents {
		names = append(names, e.Name())
	}
	sort.Strings(names)
	for _, name := range names {
		v, err := strconv.Atoi(strings.SplitN(name, "_", 2)[0])
		if err != nil || v <= cur {
			continue
		}
		b, _ := migrationsFS.ReadFile("migrations/" + name)
		tx, err := s.db.Begin()
		if err != nil {
			return err
		}
		if _, err := tx.Exec(string(b)); err != nil {
			tx.Rollback()
			return fmt.Errorf("миграция %s: %w", name, err)
		}
		if v > 1 {
			if _, err := tx.Exec(`UPDATE schema_version SET version=?`, v); err != nil {
				tx.Rollback()
				return err
			}
		}
		if err := tx.Commit(); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) now() time.Time { return s.Now().UTC() }

func ts(t time.Time) string { return t.UTC().Format(time.RFC3339) }

func parseTS(v sql.NullString) (time.Time, bool) {
	if !v.Valid || v.String == "" {
		return time.Time{}, false
	}
	t, err := time.Parse(time.RFC3339, v.String)
	return t, err == nil
}

// Hash — первые 10 hex-символов sha1 текста.
func Hash(text string) string {
	h := sha1.Sum([]byte(text))
	return hex.EncodeToString(h[:])[:10]
}

func CheckKey(theme, text string) string { return theme + ":" + Hash(text) }

// ---------- настройки ----------

var Defaults = map[string]string{
	"theme":             "system",
	"target_scope":      "milestone",
	"day_start_hour":    "4",
	"rest_per_week":     "1",
	"project_days":      "4",
	"milestone_stage":   "3",
	"milestone_target":  "",
	"hermes_template":   DefaultHermesTemplate,
	"hermes_with_brief": "1",
	"hermes_with_deps":  "0",
	"last_route":        "#/today",
	"plan_source":       "embedded",
	"plan_version":      "",
	"plan_synced_at":    "",
	"onboarded":         "0",
	"ui_zoom":           "100", // масштаб интерфейса, %
	"zoom_gopher":       "1",   // гофер при смене масштаба
	"nick":              "",    // подпись на картинках итогов
	"export_dir":        "",    // папка экспорта итогов (внутри — подпапка на каждый экспорт)
	"recap_prefs":       "",    // выбор в окне итогов (JSON)
	"theme_notes":       "",    // комментарии к пройденным темам для итогов (JSON: id темы → текст)
}

const DefaultHermesTemplate = "Тема {theme_id} {theme_title}\n{brief}\nУрок {lesson_id} — {lesson_title}{stars}\n{arrows}"

func (s *Store) Settings() (map[string]string, error) {
	m := map[string]string{}
	for k, v := range Defaults {
		m[k] = v
	}
	rows, err := s.db.Query(`SELECT key, value FROM settings`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			return nil, err
		}
		m[k] = v
	}
	return m, rows.Err()
}

func (s *Store) SetSetting(key, value string) error {
	_, err := s.db.Exec(`INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`, key, value)
	return err
}

// ---------- события ----------

func (s *Store) event(tx *sql.Tx, kind, ref string) error {
	_, err := tx.Exec(`INSERT INTO events(at,kind,ref) VALUES(?,?,?)`, ts(s.now()), kind, ref)
	return err
}

// ---------- бэкап ----------

// Backup делает VACUUM INTO в backups/. Если name пуст, файл — ascent-YYYY-MM-DD.db.
func (s *Store) Backup(name string) (string, error) {
	if s.dir == "" {
		return "", fmt.Errorf("база в памяти")
	}
	bdir := filepath.Join(s.dir, "backups")
	if err := os.MkdirAll(bdir, 0o755); err != nil {
		return "", err
	}
	if name == "" {
		name = "ascent-" + s.Now().Format("2006-01-02") + ".db"
	}
	p := filepath.Join(bdir, name)
	if _, err := os.Stat(p); err == nil {
		os.Remove(p)
	}
	if _, err := s.db.Exec(`VACUUM INTO ?`, p); err != nil {
		return "", err
	}
	s.pruneBackups(bdir, 14)
	return p, nil
}

// DailyBackup делает бэкап, если сегодня его ещё не было.
func (s *Store) DailyBackup() (string, error) {
	if s.dir == "" {
		return "", nil
	}
	p := filepath.Join(s.dir, "backups", "ascent-"+s.Now().Format("2006-01-02")+".db")
	if _, err := os.Stat(p); err == nil {
		return "", nil
	}
	return s.Backup("")
}

func (s *Store) pruneBackups(dir string, keep int) {
	ents, err := os.ReadDir(dir)
	if err != nil {
		return
	}
	var names []string
	for _, e := range ents {
		if strings.HasPrefix(e.Name(), "ascent-") && strings.HasSuffix(e.Name(), ".db") {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)
	for len(names) > keep {
		os.Remove(filepath.Join(dir, names[0]))
		names = names[1:]
	}
}

// Reset удаляет весь прогресс (настройки остаются, кроме onboarded).
func (s *Store) Reset() error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, t := range []string{"lesson_progress", "check_progress", "marker_progress", "rest_days", "events", "orphans", "achievements", "kq_progress"} {
		if _, err := tx.Exec(`DELETE FROM ` + t); err != nil {
			return err
		}
	}
	return tx.Commit()
}
