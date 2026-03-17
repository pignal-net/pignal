ALTER TABLE signals ADD COLUMN pinned_at TEXT;
CREATE INDEX idx_signals_pinned ON signals (pinned_at);
