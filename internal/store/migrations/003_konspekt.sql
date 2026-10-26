-- Отметки вопросов конспекта урока. Ключ — ID урока и хеш текста вопроса.
-- На закрытие тем, темп и достижения не влияют: это помощь в учёбе.
CREATE TABLE kq_progress (
    kq_key     TEXT PRIMARY KEY,
    lesson_id  TEXT NOT NULL,
    done_at    TEXT NOT NULL
);
CREATE INDEX kq_progress_lesson ON kq_progress(lesson_id);
