import type Database from "better-sqlite3";

import type { CorpusSegment } from "../../../../domain/src/provenance/corpus-segment.js";

export function runSrsHarvest(
  database: Database.Database,
  segments: CorpusSegment[],
): number {
  database.exec(
    `CREATE TABLE IF NOT EXISTS srs_candidates (id TEXT PRIMARY KEY, segment_id TEXT NOT NULL, prompt TEXT NOT NULL);`,
  );
  const insert = database.prepare(
    `INSERT OR REPLACE INTO srs_candidates (id, segment_id, prompt) VALUES (@id, @segment_id, @prompt)`,
  );

  for (const segment of segments) {
    insert.run({
      id: `candidate-${segment.id}`,
      segment_id: segment.id,
      prompt: segment.text,
    });
  }

  return segments.length;
}
