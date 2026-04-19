import type Database from "better-sqlite3";

import type { CorpusSegment } from "@sona/domain/provenance/corpus-segment";

export function runAnnotationRefresh(
  database: Database.Database,
  segments: CorpusSegment[],
): number {
  database.exec(
    `CREATE TABLE IF NOT EXISTS annotation_cache (id TEXT PRIMARY KEY, segment_id TEXT NOT NULL, note TEXT NOT NULL);`,
  );
  const insert = database.prepare(
    `INSERT OR REPLACE INTO annotation_cache (id, segment_id, note) VALUES (@id, @segment_id, @note)`,
  );

  for (const segment of segments) {
    insert.run({
      id: `annotation-${segment.id}`,
      segment_id: segment.id,
      note: `${segment.text.slice(0, 18)}...`,
    });
  }

  return segments.length;
}
