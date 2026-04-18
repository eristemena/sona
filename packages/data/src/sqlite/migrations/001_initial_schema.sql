CREATE TABLE IF NOT EXISTS corpus_segments (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  stratum TEXT NOT NULL,
  text TEXT NOT NULL,
  start_offset INTEGER,
  end_offset INTEGER,
  learner_approved INTEGER NOT NULL,
  captured_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS study_candidate_provenance (
  id TEXT PRIMARY KEY,
  segment_id TEXT NOT NULL,
  candidate_type TEXT NOT NULL,
  derivation_track TEXT NOT NULL,
  tokenization_result_id TEXT,
  provider_policy_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (segment_id) REFERENCES corpus_segments(id)
);
