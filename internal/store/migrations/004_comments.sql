-- Комментарии к урокам и темам: несколько на цель, у каждого — дата и отметка «сделано».
-- target — ID урока или темы. created_at NULL — перенесённый старый комментарий («раньше»).
CREATE TABLE comments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    target      TEXT NOT NULL,
    text        TEXT NOT NULL,
    done_at     TEXT,
    created_at  TEXT,
    updated_at  TEXT
);
CREATE INDEX comments_target ON comments(target);

-- перенос: заметка урока (одна на урок) → первый комментарий урока
INSERT INTO comments(target, text)
    SELECT lesson_id, note FROM lesson_progress WHERE trim(COALESCE(note, '')) <> '' ORDER BY lesson_id;

-- перенос: комментарии к темам из настройки theme_notes (JSON id → текст)
INSERT INTO comments(target, text)
    SELECT j.key, j.value FROM settings s, json_each(s.value) j
    WHERE s.key = 'theme_notes' AND json_valid(s.value) AND trim(COALESCE(j.value, '')) <> ''
    ORDER BY j.key;
