package store

import (
	"strings"

	"ascent/internal/plan"
)

type SyncReport struct {
	Added     int      `json:"added"`
	Moved     int      `json:"moved"`
	Orphans   int      `json:"orphans"`
	Version   string   `json:"version"`
	MovedList []string `json:"movedList"`
}

func parentOf(id string) string {
	if i := strings.LastIndex(id, "."); i >= 0 {
		return id[:i]
	}
	return id
}

// Sync приводит lesson_progress в соответствие с планом (раздел 14.2).
func (s *Store) Sync(p *plan.Plan) (SyncReport, error) {
	rep := SyncReport{Version: p.Version}
	tx, err := s.db.Begin()
	if err != nil {
		return rep, err
	}
	defer tx.Rollback()

	type row struct {
		id, title, status string
		done              *string
		started           *string
		imported          int
		note              string
	}
	rows, err := tx.Query(`SELECT lesson_id,title_snap,status,done_at,started_at,imported,note FROM lesson_progress`)
	if err != nil {
		return rep, err
	}
	have := map[string]row{}
	for rows.Next() {
		var r row
		var d, st *string
		if err := rows.Scan(&r.id, &r.title, &r.status, &d, &st, &r.imported, &r.note); err != nil {
			rows.Close()
			return rep, err
		}
		r.done, r.started = d, st
		have[r.id] = r
	}
	rows.Close()

	// 3. строки, которых нет в плане
	for id, r := range have {
		if p.Lessons[id] != nil {
			continue
		}
		delete(have, id)
		if r.status == "todo" && r.note == "" {
			if _, err := tx.Exec(`DELETE FROM lesson_progress WHERE lesson_id=?`, id); err != nil {
				return rep, err
			}
			continue
		}
		// ищем урок с тем же заголовком в той же теме/блоке
		var cand []string
		par := parentOf(id)
		for _, pid := range p.Order {
			l := p.Lessons[pid]
			if l.Title != r.title {
				continue
			}
			if parentOf(pid) == par || l.Block == par || l.Theme == par {
				cand = append(cand, pid)
			}
		}
		if len(cand) == 1 {
			t := have[cand[0]]
			_, exists := have[cand[0]]
			if !exists || t.status == "todo" {
				if _, err := tx.Exec(`DELETE FROM lesson_progress WHERE lesson_id=?`, id); err != nil {
					return rep, err
				}
				if _, err := tx.Exec(`INSERT INTO lesson_progress(lesson_id,status,started_at,done_at,imported,title_snap,note) VALUES(?,?,?,?,?,?,?)
					ON CONFLICT(lesson_id) DO UPDATE SET status=excluded.status, started_at=excluded.started_at, done_at=excluded.done_at, imported=excluded.imported, note=excluded.note, title_snap=excluded.title_snap`,
					cand[0], r.status, r.started, r.done, r.imported, r.title, r.note); err != nil {
					return rep, err
				}
				have[cand[0]] = row{id: cand[0], title: r.title, status: r.status}
				rep.Moved++
				rep.MovedList = append(rep.MovedList, id+" → "+cand[0])
				continue
			}
		}
		if _, err := tx.Exec(`INSERT OR REPLACE INTO orphans(lesson_id,title_snap,status,done_at,found_at) VALUES(?,?,?,?,?)`, id, r.title, r.status, r.done, ts(s.now())); err != nil {
			return rep, err
		}
		if _, err := tx.Exec(`DELETE FROM lesson_progress WHERE lesson_id=?`, id); err != nil {
			return rep, err
		}
		rep.Orphans++
	}

	// 2. каждый урок плана
	for _, id := range p.Order {
		l := p.Lessons[id]
		if _, ok := have[id]; !ok {
			if _, err := tx.Exec(`INSERT INTO lesson_progress(lesson_id,status,title_snap) VALUES(?,'todo',?)`, id, l.Title); err != nil {
				return rep, err
			}
			rep.Added++
		} else if _, err := tx.Exec(`UPDATE lesson_progress SET title_snap=? WHERE lesson_id=?`, l.Title, id); err != nil {
			return rep, err
		}
	}
	if err := s.event(tx, "plan_sync", p.Version); err != nil {
		return rep, err
	}
	return rep, tx.Commit()
}
