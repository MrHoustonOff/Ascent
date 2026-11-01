package store

import (
	"database/sql"
	"strings"
	"time"
)

// Comment — комментарий к уроку или теме. Created нулевой — перенесённый старый («раньше»).
type Comment struct {
	ID      int64
	Target  string
	Text    string
	Done    bool
	Created time.Time
	DoneAt  time.Time
}

func (s *Store) Comments() ([]Comment, error) {
	rows, err := s.db.Query(`SELECT id, target, text, done_at, created_at FROM comments ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Comment
	for rows.Next() {
		var c Comment
		var done, created sql.NullString
		if err := rows.Scan(&c.ID, &c.Target, &c.Text, &done, &created); err != nil {
			return nil, err
		}
		if done.Valid {
			c.Done, c.DoneAt = true, parseTime(done.String)
		}
		if created.Valid {
			c.Created = parseTime(created.String)
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) AddComment(target, text string) (int64, error) {
	now := s.Now().UTC().Format(time.RFC3339)
	r, err := s.db.Exec(`INSERT INTO comments(target, text, created_at, updated_at) VALUES(?,?,?,?)`, target, strings.TrimSpace(text), now, now)
	if err != nil {
		return 0, err
	}
	return r.LastInsertId()
}

func (s *Store) UpdateComment(id int64, text string) error {
	_, err := s.db.Exec(`UPDATE comments SET text=?, updated_at=? WHERE id=?`, strings.TrimSpace(text), s.Now().UTC().Format(time.RFC3339), id)
	return err
}

func (s *Store) SetCommentDone(id int64, done bool) error {
	var v any
	if done {
		v = s.Now().UTC().Format(time.RFC3339)
	}
	_, err := s.db.Exec(`UPDATE comments SET done_at=? WHERE id=?`, v, id)
	return err
}

func (s *Store) DeleteComment(id int64) error {
	_, err := s.db.Exec(`DELETE FROM comments WHERE id=?`, id)
	return err
}

func parseTime(v string) time.Time {
	t, err := time.Parse(time.RFC3339, v)
	if err != nil {
		return time.Time{}
	}
	return t
}
