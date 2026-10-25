CREATE TABLE schema_version (version INTEGER NOT NULL);
INSERT INTO schema_version VALUES (1);

-- Прогресс по урокам. Ключ — ID урока из плана.
CREATE TABLE lesson_progress (
    lesson_id   TEXT PRIMARY KEY,
    status      TEXT NOT NULL CHECK (status IN ('todo','doing','done')),
    started_at  TEXT,
    done_at     TEXT,
    imported    INTEGER NOT NULL DEFAULT 0,
    title_snap  TEXT NOT NULL,
    note        TEXT NOT NULL DEFAULT ''
);

CREATE TABLE check_progress (
    check_key   TEXT PRIMARY KEY,
    theme_id    TEXT NOT NULL,
    done_at     TEXT NOT NULL
);

CREATE TABLE marker_progress (
    marker_key  TEXT PRIMARY KEY,
    block_id    TEXT NOT NULL,
    done_at     TEXT NOT NULL
);

CREATE TABLE rest_days (day TEXT PRIMARY KEY);

CREATE TABLE events (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    at    TEXT NOT NULL,
    kind  TEXT NOT NULL,
    ref   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX events_at ON events(at);

CREATE TABLE orphans (
    lesson_id   TEXT PRIMARY KEY,
    title_snap  TEXT NOT NULL,
    status      TEXT NOT NULL,
    done_at     TEXT,
    found_at    TEXT NOT NULL
);

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
