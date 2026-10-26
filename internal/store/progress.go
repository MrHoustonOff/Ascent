package store

import (
	"database/sql"
	"time"
)

type Lesson struct {
	ID        string
	Status    string // todo | doing | done
	StartedAt time.Time
	DoneAt    time.Time
	Imported  bool
	Note      string
	Title     string
}

func (l Lesson) HasStart() bool { return !l.StartedAt.IsZero() }
func (l Lesson) HasDone() bool  { return !l.DoneAt.IsZero() }

// Lessons возвращает весь прогресс по урокам.
func (s *Store) Lessons() (map[string]Lesson, error) {
	rows, err := s.db.Query(`SELECT lesson_id,status,started_at,done_at,imported,note,title_snap FROM lesson_progress`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	m := map[string]Lesson{}
	for rows.Next() {
		var l Lesson
		var st, dn sql.NullString
		var imp int
		if err := rows.Scan(&l.ID, &l.Status, &st, &dn, &imp, &l.Note, &l.Title); err != nil {
			return nil, err
		}
		l.StartedAt, _ = parseTS(st)
		l.DoneAt, _ = parseTS(dn)
		l.Imported = imp == 1
		m[l.ID] = l
	}
	return m, rows.Err()
}

// StartLesson: остальные doing возвращаются в todo, X получает doing.
func (s *Store) StartLesson(id string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`UPDATE lesson_progress SET status='todo', started_at=NULL WHERE status='doing' AND lesson_id<>?`, id); err != nil {
		return err
	}
	res, err := tx.Exec(`UPDATE lesson_progress SET status='doing', started_at=?, done_at=NULL, imported=0 WHERE lesson_id=?`, ts(s.now()), id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	if err := s.event(tx, "lesson_start", id); err != nil {
		return err
	}
	return tx.Commit()
}

// CompleteLesson: status=done, done_at=now, started_at сохраняется.
func (s *Store) CompleteLesson(id string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	res, err := tx.Exec(`UPDATE lesson_progress SET status='done', done_at=?, imported=0 WHERE lesson_id=?`, ts(s.now()), id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	if err := s.event(tx, "lesson_done", id); err != nil {
		return err
	}
	return tx.Commit()
}

// UndoLesson снимает отметку.
func (s *Store) UndoLesson(id string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`UPDATE lesson_progress SET status='todo', done_at=NULL, started_at=NULL, imported=0 WHERE lesson_id=?`, id); err != nil {
		return err
	}
	if err := s.event(tx, "lesson_undo", id); err != nil {
		return err
	}
	return tx.Commit()
}

// RestoreLesson возвращает строку в прежнее состояние (для «Отменить» в тосте).
func (s *Store) RestoreLesson(l Lesson) error {
	var st, dn any
	if l.HasStart() {
		st = ts(l.StartedAt)
	}
	if l.HasDone() {
		dn = ts(l.DoneAt)
	}
	imp := 0
	if l.Imported {
		imp = 1
	}
	_, err := s.db.Exec(`UPDATE lesson_progress SET status=?, started_at=?, done_at=?, imported=? WHERE lesson_id=?`, l.Status, st, dn, imp, l.ID)
	return err
}

// MarkDoneUpTo отмечает ids как пройденные массово (imported=1). Возвращает число изменённых.
func (s *Store) MarkDoneUpTo(ids []string) (int, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()
	n := 0
	for _, id := range ids {
		res, err := tx.Exec(`UPDATE lesson_progress SET status='done', imported=1, done_at=NULL, started_at=NULL WHERE lesson_id=? AND status<>'done'`, id)
		if err != nil {
			return 0, err
		}
		c, _ := res.RowsAffected()
		n += int(c)
	}
	if err := s.event(tx, "import", ""); err != nil {
		return 0, err
	}
	return n, tx.Commit()
}

func (s *Store) SetNote(id, text string) error {
	_, err := s.db.Exec(`UPDATE lesson_progress SET note=? WHERE lesson_id=?`, text, id)
	return err
}

// ---------- вопросы и маркеры ----------

func (s *Store) keySet(q string) (map[string]time.Time, error) {
	rows, err := s.db.Query(q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	m := map[string]time.Time{}
	for rows.Next() {
		var k, d string
		if err := rows.Scan(&k, &d); err != nil {
			return nil, err
		}
		t, _ := time.Parse(time.RFC3339, d)
		m[k] = t
	}
	return m, rows.Err()
}

func (s *Store) Checks() (map[string]time.Time, error) {
	return s.keySet(`SELECT check_key, done_at FROM check_progress`)
}

func (s *Store) Markers() (map[string]time.Time, error) {
	return s.keySet(`SELECT marker_key, done_at FROM marker_progress`)
}

func (s *Store) SetCheck(theme, key string, done bool) error {
	return s.setKey("check_progress", "check_key", "theme_id", "check", theme, key, done)
}

func (s *Store) SetMarker(block, key string, done bool) error {
	return s.setKey("marker_progress", "marker_key", "block_id", "marker", block, key, done)
}

func (s *Store) setKey(table, kcol, gcol, ev, group, key string, done bool) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if done {
		if _, err := tx.Exec(`INSERT INTO `+table+`(`+kcol+`,`+gcol+`,done_at) VALUES(?,?,?) ON CONFLICT(`+kcol+`) DO NOTHING`, key, group, ts(s.now())); err != nil {
			return err
		}
		if err := s.event(tx, ev+"_done", key); err != nil {
			return err
		}
	} else {
		if _, err := tx.Exec(`DELETE FROM `+table+` WHERE `+kcol+`=?`, key); err != nil {
			return err
		}
		if err := s.event(tx, ev+"_undo", key); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// ---------- дни отдыха ----------

func (s *Store) RestDays() (map[string]bool, error) {
	rows, err := s.db.Query(`SELECT day FROM rest_days`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	m := map[string]bool{}
	for rows.Next() {
		var d string
		if err := rows.Scan(&d); err != nil {
			return nil, err
		}
		m[d] = true
	}
	return m, rows.Err()
}

func (s *Store) AddRest(day string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`INSERT OR IGNORE INTO rest_days(day) VALUES(?)`, day); err != nil {
		return err
	}
	if err := s.event(tx, "rest", day); err != nil {
		return err
	}
	return tx.Commit()
}

// ---------- события для статистики ----------

// CheckEvents возвращает моменты отметок вопросов и маркеров.
func (s *Store) CheckTimes() ([]time.Time, error) {
	var out []time.Time
	for _, q := range []string{`SELECT done_at FROM check_progress`, `SELECT done_at FROM marker_progress`} {
		rows, err := s.db.Query(q)
		if err != nil {
			return nil, err
		}
		for rows.Next() {
			var d string
			if err := rows.Scan(&d); err != nil {
				rows.Close()
				return nil, err
			}
			if t, err := time.Parse(time.RFC3339, d); err == nil {
				out = append(out, t)
			}
		}
		rows.Close()
	}
	return out, nil
}

// ---------- сироты ----------

type Orphan struct {
	ID, Title, Status string
	DoneAt            time.Time
}

func (s *Store) Orphans() ([]Orphan, error) {
	rows, err := s.db.Query(`SELECT lesson_id,title_snap,status,done_at FROM orphans ORDER BY lesson_id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Orphan
	for rows.Next() {
		var o Orphan
		var d sql.NullString
		if err := rows.Scan(&o.ID, &o.Title, &o.Status, &d); err != nil {
			return nil, err
		}
		o.DoneAt, _ = parseTS(d)
		out = append(out, o)
	}
	return out, rows.Err()
}

// AdoptOrphan переносит прогресс сироты на урок target (если он ещё todo).
func (s *Store) AdoptOrphan(orphan, target string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var st string
	var dn sql.NullString
	if err := tx.QueryRow(`SELECT status,done_at FROM orphans WHERE lesson_id=?`, orphan).Scan(&st, &dn); err != nil {
		return err
	}
	if _, err := tx.Exec(`UPDATE lesson_progress SET status=?, done_at=?, imported=? WHERE lesson_id=?`, st, dn, boolInt(!dn.Valid && st == "done"), target); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM orphans WHERE lesson_id=?`, orphan); err != nil {
		return err
	}
	return tx.Commit()
}

func boolInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// ---------- достижения ----------

type AchRow struct {
	At   time.Time
	Seen bool
}

func (s *Store) Achievements() (map[string]AchRow, error) {
	rows, err := s.db.Query(`SELECT id, unlocked_at, seen FROM achievements`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	m := map[string]AchRow{}
	for rows.Next() {
		var id, at string
		var seen int
		if err := rows.Scan(&id, &at, &seen); err != nil {
			return nil, err
		}
		t, _ := time.Parse(time.RFC3339, at)
		m[id] = AchRow{At: t, Seen: seen == 1}
	}
	return m, rows.Err()
}

// UnlockAchievement записывает достижение один раз; at может быть нулевым.
func (s *Store) UnlockAchievement(id string, at time.Time, seen bool) error {
	v := ""
	if !at.IsZero() {
		v = ts(at)
	}
	_, err := s.db.Exec(`INSERT OR IGNORE INTO achievements(id, unlocked_at, seen) VALUES(?,?,?)`, id, v, boolInt(seen))
	return err
}

func (s *Store) MarkAchievementsSeen() error {
	_, err := s.db.Exec(`UPDATE achievements SET seen=1 WHERE seen=0`)
	return err
}
