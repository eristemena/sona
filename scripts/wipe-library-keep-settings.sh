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

if [[ -n "${SONA_USER_DATA_DIR:-}" ]]; then
  user_data_dirs=("$SONA_USER_DATA_DIR")
else
  user_data_dirs=(
    "$HOME/Library/Application Support/sona"
    "$HOME/Library/Application Support/@sona/desktop"
  )
fi

wipe_tables=(
  review_events
  known_words
  review_cards
  exposure_log
  reading_progress
  annotations
  block_audio_assets
  generation_requests
  content_source_records
  content_blocks
  content_library_items
  study_candidate_provenance
  corpus_segments
)

found_wipe_target=false

for user_data_dir in "${user_data_dirs[@]}"; do
  database_path="$user_data_dir/sona.db"
  audio_cache_dir="$user_data_dir/reading-audio-cache"

  if [[ ! -f "$database_path" && ! -d "$audio_cache_dir" ]]; then
    continue
  fi

  found_wipe_target=true

  if [[ -f "$database_path" ]]; then
    sql_statements=("PRAGMA foreign_keys = OFF;")

    for table_name in "${wipe_tables[@]}"; do
      if [[ -n "$(sqlite3 "$database_path" "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '$table_name';")" ]]; then
        sql_statements+=("DELETE FROM $table_name;")
      fi
    done

    sql_statements+=(
      "PRAGMA wal_checkpoint(TRUNCATE);"
      "VACUUM;"
      "PRAGMA foreign_keys = ON;"
    )

    printf '%s\n' "${sql_statements[@]}" | sqlite3 "$database_path" >/dev/null
    echo "Wiped library data from $database_path"
  else
    echo "Database not found at $database_path. Skipping table cleanup."
  fi

  rm -rf "$audio_cache_dir"
  echo "Removed cached reading audio from $audio_cache_dir"
done

if [[ "$found_wipe_target" == false ]]; then
  echo "Nothing to wipe. No database or audio cache found in:"
  for user_data_dir in "${user_data_dirs[@]}"; do
    echo "  $user_data_dir"
  done
  exit 0
fi