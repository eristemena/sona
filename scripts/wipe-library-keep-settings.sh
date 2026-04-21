#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: npm run wipe:library -- --yes"
  echo
  echo "Deletes library content, generated reading data, and cached audio while preserving settings."
  echo "Optional environment override: SONA_USER_DATA_DIR=/custom/path"
  exit 0
fi

if [[ "${1:-}" != "--yes" ]]; then
  echo "This command deletes library content, review data, annotations, reading progress, and cached audio, but keeps settings." >&2
  echo "Close the desktop app first, then rerun with: npm run wipe:library -- --yes" >&2
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 CLI was not found. Install it first, then rerun this command." >&2
  exit 1
fi

user_data_dir="${SONA_USER_DATA_DIR:-$HOME/Library/Application Support/sona}"
database_path="$user_data_dir/sona.db"
audio_cache_dir="$user_data_dir/reading-audio-cache"

if [[ ! -f "$database_path" && ! -d "$audio_cache_dir" ]]; then
  echo "Nothing to wipe. No database or audio cache found in $user_data_dir"
  exit 0
fi

if [[ -f "$database_path" ]]; then
  sqlite3 "$database_path" <<'SQL'
PRAGMA foreign_keys = OFF;
DELETE FROM review_cards;
DELETE FROM exposure_log;
DELETE FROM reading_progress;
DELETE FROM annotations;
DELETE FROM block_audio_assets;
DELETE FROM generation_requests;
DELETE FROM content_source_records;
DELETE FROM content_blocks;
DELETE FROM content_library_items;
DELETE FROM study_candidate_provenance;
DELETE FROM corpus_segments;
PRAGMA wal_checkpoint(TRUNCATE);
VACUUM;
PRAGMA foreign_keys = ON;
SQL
  echo "Wiped library data from $database_path"
else
  echo "Database not found at $database_path. Skipping table cleanup."
fi

rm -rf "$audio_cache_dir"
echo "Removed cached reading audio from $audio_cache_dir"