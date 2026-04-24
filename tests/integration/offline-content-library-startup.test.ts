import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AnnotationCacheService } from "../../apps/desktop/src/main/content/annotation-cache-service.js";
import { AudioCacheService } from "../../apps/desktop/src/main/content/audio-cache-service.js";
import { registerContentHandlers } from '../../apps/desktop/src/main/ipc/content-handlers.js'
import { registerReadingHandlers } from "../../apps/desktop/src/main/ipc/reading-handlers.js";
import { registerShellHandlers } from '../../apps/desktop/src/main/ipc/shell-handlers.js'
import { ReadingProgressService } from "../../apps/desktop/src/main/content/reading-progress-service.js";
import { ReadingSessionService } from "../../apps/desktop/src/main/content/reading-session-service.js";
import { ReviewCardService } from "../../apps/desktop/src/main/content/review-card-service.js";
import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { READING_CHANNELS } from "../../packages/domain/src/contracts/content-reading.js";
import { SqliteSettingsRepository } from '../../packages/data/src/sqlite/settings-repository.js'
import {
  buildContentBlockId,
  buildContentItemId,
  normalizeSearchText,
  toDifficultyBadge,
} from "../../packages/domain/src/content/index.js";
import { CONTENT_CHANNELS } from '../../packages/domain/src/contracts/content-library.js'
import { THEME_PREFERENCE_SETTING_KEY } from '../../packages/domain/src/settings/theme-preference.js'
import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

function createDatabasePath(prefix: string) {
  const directory = mkdtempSync(path.join(tmpdir(), prefix))
  tempDirectories.push(directory)
  return path.join(directory, 'sona.db')
}

describe('offline content-library startup', () => {
  beforeEach(() => {
    resetElectronMock()
  })

  it('preserves existing shell settings while migrating in the content-library schema', () => {
    const databasePath = createDatabasePath('sona-offline-library-migration-')
    const legacyDatabase = createSqliteConnection({ databasePath })

    legacyDatabase.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        checksum TEXT,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)

    legacyDatabase
      .prepare('INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)')
      .run(1, '001_shell_v1', null, new Date('2026-04-18T12:00:00.000Z').toISOString())
    legacyDatabase
      .prepare('INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)')
      .run(THEME_PREFERENCE_SETTING_KEY, JSON.stringify({ mode: 'dark' }), new Date('2026-04-18T12:00:00.000Z').toISOString())
    legacyDatabase.close()

    const migratedDatabase = createSqliteConnection({ databasePath })
    runShellMigrations(migratedDatabase)
    const settingsRepository = new SqliteSettingsRepository(migratedDatabase)

    expect(settingsRepository.getThemePreferenceMode()).toBe('dark')

    const tables = migratedDatabase
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('annotations', 'block_audio_assets', 'content_library_items', 'content_blocks', 'content_source_records', 'exposure_log', 'generation_requests', 'reading_progress', 'review_cards', 'study_sessions') ORDER BY name",
      )
      .all() as Array<{ name: string }>;
    const appliedVersions = migratedDatabase
      .prepare('SELECT version FROM schema_migrations ORDER BY version ASC')
      .all() as Array<{ version: number }>

    expect(tables.map((row) => row.name)).toEqual([
      "annotations",
      "block_audio_assets",
      "content_blocks",
      "content_library_items",
      "content_source_records",
      "exposure_log",
      "generation_requests",
      "reading_progress",
      "review_cards",
      "study_sessions",
    ]);
    expect(appliedVersions.map((row) => row.version)).toEqual([1, 2, 3, 4, 5, 6]);

    migratedDatabase.close()
  })

  it('boots shell and content-library handlers against a migrated offline database', async () => {
    const databasePath = createDatabasePath('sona-offline-library-bootstrap-')
    const database = createSqliteConnection({ databasePath })
    runShellMigrations(database)

    const settingsRepository = new SqliteSettingsRepository(database)
    settingsRepository.setThemePreferenceMode('light')

    registerShellHandlers(
      { settingsRepository },
      {
        ipcMain: electronMockState.ipcMain,
        nativeTheme: electronMockState.nativeTheme,
      },
    )
    registerContentHandlers(
      {
        contentRepository: new SqliteContentLibraryRepository(database),
      },
      {
        ipcMain: electronMockState.ipcMain,
        dialog: electronMockState.dialog,
        browserWindow: { getFocusedWindow: () => null },
      },
    )

    const bootstrapHandler = electronMockState.ipcMainHandlers.get('sona:shell:get-bootstrap-state')
    const listHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.listLibraryItems)
    const blocksHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.getContentBlocks)

    if (!bootstrapHandler || !listHandler || !blocksHandler) {
      throw new Error('Expected shell and content handlers to be registered during offline startup.')
    }

    const bootstrapState = await bootstrapHandler(undefined)
    const listedItems = await listHandler(undefined, { filter: 'all' })
    const missingBlocks = await blocksHandler(undefined, 'missing-item')

    expect(bootstrapState).toMatchObject({
      appName: 'Sona',
      themePreference: 'light',
      resolvedTheme: 'light',
    })
    expect(listedItems).toEqual([])
    expect(missingBlocks).toEqual([])

    database.close()
  })

  it("boots reading handlers against a migrated offline database and opens a text-first reading session", async () => {
    const databasePath = createDatabasePath("sona-offline-reading-bootstrap-");
    const database = createSqliteConnection({ databasePath });
    runShellMigrations(database);

    const contentRepository = new SqliteContentLibraryRepository(database);
    const createdAt = 1_714_150_000_000;
    const sourceLocator = "article://offline-reading-startup";
    const contentItemId = buildContentItemId({
      sourceType: "article",
      sourceLocator,
      createdAt,
    });
    const blockId = buildContentBlockId({
      sourceType: "article",
      sourceLocator,
      contentItemCreatedAt: createdAt,
      sentenceOrdinal: 1,
    });

    contentRepository.saveContent({
      item: {
        id: contentItemId,
        title: "Offline reading startup",
        sourceType: "article",
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: "Article paste",
        sourceLocator,
        provenanceDetail: "Used for offline reading bootstrap validation.",
        searchText: normalizeSearchText(
          "Offline reading startup 오늘도 천천히 읽어요",
        ),
        duplicateCheckText: normalizeSearchText("오늘도 천천히 읽어요"),
        createdAt,
      },
      blocks: [
        {
          id: blockId,
          contentItemId,
          korean: "오늘도 천천히 읽어요",
          romanization: null,
          tokens: [
            { surface: "오늘도" },
            { surface: "천천히" },
            { surface: "읽어요" },
          ],
          annotations: {},
          difficulty: 2,
          sourceType: "article",
          audioOffset: null,
          sentenceOrdinal: 1,
          createdAt,
        },
      ],
      sourceRecord: {
        contentItemId,
        originMode: "article-paste",
        filePath: null,
        url: sourceLocator,
        sessionId: null,
        displaySource: "Article paste",
        requestedDifficulty: null,
        validatedDifficulty: null,
        capturedAt: createdAt,
      },
    });

    const audioCacheService = new AudioCacheService({
      repository: contentRepository,
      cacheDirectory: path.join(
        path.dirname(databasePath),
        "reading-audio-cache",
      ),
    });
    const readingSessionService = new ReadingSessionService({
      repository: contentRepository,
      readingProgressService: new ReadingProgressService(contentRepository),
      audioCacheService,
      annotationCacheService: new AnnotationCacheService({
        repository: contentRepository,
        provider: {
          id: "openrouter",
          modelId: "openai/gpt-4o-mini",
          lookupWord: async () => {
            throw new Error("offline");
          },
          explainGrammar: async () => {
            throw new Error("offline");
          },
        },
      }),
      reviewCardService: new ReviewCardService({
        repository: contentRepository,
      }),
    });

    registerReadingHandlers(
      {
        readingSessionService,
        readingProgressService: new ReadingProgressService(contentRepository),
        audioCacheService,
      },
      {
        ipcMain: electronMockState.ipcMain,
      },
    );

    const getReadingSessionHandler = electronMockState.ipcMainHandlers.get(
      READING_CHANNELS.getReadingSession,
    );
    const ensureBlockAudioHandler = electronMockState.ipcMainHandlers.get(
      READING_CHANNELS.ensureBlockAudio,
    );

    if (!getReadingSessionHandler || !ensureBlockAudioHandler) {
      throw new Error(
        "Expected reading handlers to be registered during offline startup.",
      );
    }

    const snapshot = await getReadingSessionHandler(undefined, contentItemId);
    const audioAsset = await ensureBlockAudioHandler(undefined, blockId);

    expect(snapshot).toMatchObject({
      contentItemId,
      itemTitle: "Offline reading startup",
      blocks: [
        {
          id: blockId,
          korean: "오늘도 천천히 읽어요",
        },
      ],
      progress: {
        activeBlockId: null,
        playbackState: "idle",
        playbackRate: 1,
        currentTimeMs: 0,
        highlightedTokenIndex: null,
      },
    });
    expect(audioAsset).toMatchObject({
      blockId,
      state: "unavailable",
    });
    expect(audioAsset.failureMessage).toMatch(/text-first mode/i);

    database.close();
  });
})