-- Открытые достижения. Однажды открытое остаётся навсегда.
CREATE TABLE achievements (
    id          TEXT PRIMARY KEY,
    unlocked_at TEXT NOT NULL,   -- момент выполнения условия (RFC3339 UTC); пусто, если открыто массово
    seen        INTEGER NOT NULL DEFAULT 0
);
