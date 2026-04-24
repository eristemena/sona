CREATE TABLE study_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL,
  study_date TEXT NOT NULL,
  cards_reviewed INTEGER NOT NULL CHECK (cards_reviewed >= 0),
  minutes_studied INTEGER NOT NULL CHECK (minutes_studied >= 0),
  source TEXT NOT NULL CHECK (source IN ('review-session'))
);

CREATE INDEX idx_study_sessions_study_date
  ON study_sessions(study_date DESC);

CREATE INDEX idx_study_sessions_ended_at
  ON study_sessions(ended_at DESC);