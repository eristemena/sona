"use client";

import {
  Eye,
  EyeOff,
  LaptopMinimal,
  LoaderCircle,
  Minus,
  MoonStar,
  Plus,
  SunMedium,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { KNOWN_WORD_SEED_PACKS_BY_ID } from "@sona/domain/content/known-word-seeds";
import type {
  PreviewTtsVoiceResult,
  ProviderKeyStatus,
  SaveStudyPreferencesInput,
} from "@sona/domain/contracts/window-sona";
import type { ReadingAudioVoice } from "@sona/domain/settings/reading-audio-preference";
import {
  STUDY_KOREAN_LEVEL_OPTIONS,
  STUDY_TTS_VOICE_OPTIONS,
  type StudyKoreanLevel,
} from "@sona/domain/settings/study-preferences";
import type { ThemePreferenceMode } from "@sona/domain/settings/theme-preference";

import { cn } from "../../lib/utils";
import { useThemePreference } from "../../lib/use-theme-preference";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const THEME_OPTIONS: Array<{
  mode: ThemePreferenceMode;
  label: string;
  icon: typeof LaptopMinimal;
}> = [
  { mode: "system", label: "System", icon: LaptopMinimal },
  { mode: "dark", label: "Dark", icon: MoonStar },
  { mode: "light", label: "Light", icon: SunMedium },
];

interface SettingsDraft {
  openAiApiKey: string;
  openRouterApiKey: string;
  selectedVoice: ReadingAudioVoice;
  dailyGoal: number;
  koreanLevel: StudyKoreanLevel;
  maxLlmCallsPerSession: number;
  annotationCacheDays: number;
}

interface KeyTouchState {
  openAi: boolean;
  openRouter: boolean;
}

export function ThemeSettings() {
  const { themePreference, setThemePreference } = useThemePreference();
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [lastSavedSignature, setLastSavedSignature] = useState<string | null>(
    null,
  );
  const [touchedKeys, setTouchedKeys] = useState<KeyTouchState>({
    openAi: false,
    openRouter: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingOpenAi, setIsTestingOpenAi] = useState(false);
  const [isTestingOpenRouter, setIsTestingOpenRouter] = useState(false);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  const [isReseedingWords, setIsReseedingWords] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [openAiStatusMessage, setOpenAiStatusMessage] = useState("");
  const [openRouterStatusMessage, setOpenRouterStatusMessage] = useState("");
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [generalMessage, setGeneralMessage] = useState<string | null>(null);
  const [advancedMessage, setAdvancedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isReseedDialogOpen, setIsReseedDialogOpen] = useState(false);
  const [isClearCacheDialogOpen, setIsClearCacheDialogOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const availableVoices = useMemo(() => STUDY_TTS_VOICE_OPTIONS, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const snapshot = await window.sona.settings.getStudyPreferences();
        if (!active) {
          return;
        }

        const nextDraft: SettingsDraft = {
          openAiApiKey: "",
          openRouterApiKey: "",
          selectedVoice: snapshot.selectedVoice as ReadingAudioVoice,
          dailyGoal: snapshot.dailyGoal,
          koreanLevel: snapshot.koreanLevel as StudyKoreanLevel,
          maxLlmCallsPerSession: snapshot.maxLlmCallsPerSession,
          annotationCacheDays: snapshot.annotationCacheDays,
        };

        setDraft(nextDraft);
        setLastSavedSignature(
          getPayloadSignature(
            buildSavePayload(nextDraft, { openAi: false, openRouter: false }),
          ),
        );
        setOpenAiStatusMessage(
          getKeyStatusMessage(snapshot.openAiKeyStatus, "OpenAI"),
        );
        setOpenRouterStatusMessage(
          getKeyStatusMessage(snapshot.openRouterKeyStatus, "OpenRouter"),
        );
      } catch {
        if (active) {
          setSaveError("Settings could not be loaded.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!draft || isLoading) {
      return;
    }

    const payload = buildSavePayload(draft, touchedKeys);
    const signature = getPayloadSignature(payload);
    if (signature === lastSavedSignature) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSaving(true);
      setSaveError(null);

      const touchedState = touchedKeys;
      const activeDraft = draft;

      try {
        const result = await window.sona.settings.saveStudyPreferences(payload);
        const normalizedDraft: SettingsDraft = {
          ...activeDraft,
          selectedVoice: result.selectedVoice as ReadingAudioVoice,
          dailyGoal: result.dailyGoal,
          koreanLevel: result.koreanLevel as StudyKoreanLevel,
          maxLlmCallsPerSession: result.maxLlmCallsPerSession,
          annotationCacheDays: result.annotationCacheDays,
        };
        const resetTouchedKeys = {
          openAi: false,
          openRouter: false,
        };

        setDraft(normalizedDraft);
        setTouchedKeys(resetTouchedKeys);
        setLastSavedSignature(
          getPayloadSignature(
            buildSavePayload(normalizedDraft, resetTouchedKeys),
          ),
        );

        if (touchedState.openAi) {
          setOpenAiStatusMessage(
            normalizeApiKey(activeDraft.openAiApiKey)
              ? "Saved locally. Test to verify."
              : "OpenAI key removed.",
          );
        }

        if (touchedState.openRouter) {
          setOpenRouterStatusMessage(
            normalizeApiKey(activeDraft.openRouterApiKey)
              ? "Saved locally. Test to verify."
              : "OpenRouter key removed.",
          );
        }
      } catch {
        setSaveError("Settings could not be saved locally.");
      } finally {
        setIsSaving(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draft, isLoading, lastSavedSignature, touchedKeys]);

  if (isLoading || !draft) {
    return (
      <section className="flex flex-1 items-center justify-center py-16">
        <p className="text-sm text-(--text-secondary)">Loading settings...</p>
      </section>
    );
  }

  const selectedVoiceOption =
    availableVoices.find((voice) => voice.id === draft.selectedVoice) ??
    availableVoices[0];
  const selectedLevelLabel =
    STUDY_KOREAN_LEVEL_OPTIONS.find((option) => option.id === draft.koreanLevel)
      ?.label ?? "TOPIK I";

  return (
    <section className="flex flex-col pb-16 text-(--text-primary)">
      <header className="border-b border-(--border) pb-5">
        <h1 className="text-[22px] font-semibold leading-tight text-(--text-primary)">
          Settings
        </h1>
      </header>

      <div className="space-y-10 pt-8">
        <SettingsSection label="Appearance">
          <div className="flex flex-wrap gap-2">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  aria-pressed={themePreference === option.mode}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)",
                    themePreference === option.mode
                      ? "border-(--accent) bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-(--text-primary)"
                      : "border-(--border) bg-(--bg-base) text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary)",
                  )}
                  key={option.mode}
                  onClick={() => void setThemePreference(option.mode)}
                  type="button"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-[13px] text-(--text-secondary)">
            Defaults to your system preference.
          </p>
        </SettingsSection>

        <SettingsSection label="API Keys">
          <ApiKeyRow
            actionLabel={isTestingOpenAi ? "Testing..." : "Test"}
            inputId="openai-api-key"
            isBusy={isTestingOpenAi}
            label="OpenAI API Key (TTS)"
            onTest={() => void handleOpenAiValidation()}
            onToggleVisibility={() => setShowOpenAiKey((current) => !current)}
            onValueChange={(value) => {
              setDraft((current) =>
                current ? { ...current, openAiApiKey: value } : current,
              );
              setTouchedKeys((current) => ({ ...current, openAi: true }));
            }}
            placeholder="sk-..."
            showValue={showOpenAiKey}
            statusMessage={openAiStatusMessage}
            toggleLabel={
              showOpenAiKey ? "Hide OpenAI API key" : "Show OpenAI API key"
            }
            value={draft.openAiApiKey}
          />

          <ApiKeyRow
            actionLabel={isTestingOpenRouter ? "Testing..." : "Test"}
            inputId="openrouter-api-key"
            isBusy={isTestingOpenRouter}
            label="OpenRouter API Key (LLM)"
            onTest={() => void handleOpenRouterValidation()}
            onToggleVisibility={() =>
              setShowOpenRouterKey((current) => !current)
            }
            onValueChange={(value) => {
              setDraft((current) =>
                current ? { ...current, openRouterApiKey: value } : current,
              );
              setTouchedKeys((current) => ({ ...current, openRouter: true }));
            }}
            placeholder="sk-or-..."
            showValue={showOpenRouterKey}
            statusMessage={openRouterStatusMessage}
            toggleLabel={
              showOpenRouterKey
                ? "Hide OpenRouter API key"
                : "Show OpenRouter API key"
            }
            value={draft.openRouterApiKey}
          />
        </SettingsSection>

        <SettingsSection label="TTS Voice">
          <div className="flex flex-wrap gap-2">
            {availableVoices.map((voice) => (
              <button
                aria-pressed={draft.selectedVoice === voice.id}
                className={cn(
                  "inline-flex h-10 items-center rounded-full border px-4 text-[14px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)",
                  draft.selectedVoice === voice.id
                    ? "border-(--accent) bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-(--text-primary)"
                    : "border-(--border) bg-(--bg-base) text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary)",
                )}
                key={voice.id}
                onClick={() =>
                  setDraft((current) =>
                    current ? { ...current, selectedVoice: voice.id } : current,
                  )
                }
                type="button"
              >
                {voice.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="rounded-full px-4"
              disabled={isPreviewingVoice}
              onClick={() => void handlePreviewVoice()}
              type="button"
              variant="secondary"
            >
              {isPreviewingVoice ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              ) : (
                <Volume2 aria-hidden="true" className="mr-2 h-4 w-4" />
              )}
              Preview
            </Button>
            <p className="text-[13px] text-(--text-secondary)">
              {selectedVoiceOption?.description ??
                "Choose the voice used for hosted reading audio."}
            </p>
          </div>

          {previewMessage ? (
            <p
              aria-live="polite"
              className="text-[13px] text-(--text-secondary)"
            >
              {previewMessage}
            </p>
          ) : null}
        </SettingsSection>

        <SettingsSection label="General">
          <StepperField
            label="Daily review goal"
            max={500}
            min={1}
            onChange={(value) =>
              setDraft((current) =>
                current ? { ...current, dailyGoal: value } : current,
              )
            }
            value={draft.dailyGoal}
          />

          <div className="space-y-3">
            <label className="text-[14px] font-medium text-(--text-primary)">
              My Korean level
            </label>
            <div className="flex flex-wrap gap-2">
              {STUDY_KOREAN_LEVEL_OPTIONS.map((option) => (
                <button
                  aria-pressed={draft.koreanLevel === option.id}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full border px-4 text-[14px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)",
                    draft.koreanLevel === option.id
                      ? "border-(--accent) bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-(--text-primary)"
                      : "border-(--border) bg-(--bg-base) text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary)",
                  )}
                  key={option.id}
                  onClick={() =>
                    setDraft((current) =>
                      current
                        ? { ...current, koreanLevel: option.id }
                        : current,
                    )
                  }
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium text-(--text-primary)">
                Re-seed known words
              </p>
              <p className="text-[13px] text-(--text-secondary)">
                Uses your current level: {selectedLevelLabel}.
              </p>
            </div>
            <Button
              className="rounded-full px-4"
              disabled={isReseedingWords}
              onClick={() => setIsReseedDialogOpen(true)}
              type="button"
              variant="ghost"
            >
              Re-seed known words
            </Button>
          </div>

          {generalMessage ? (
            <p
              aria-live="polite"
              className="text-[13px] text-(--text-secondary)"
            >
              {generalMessage}
            </p>
          ) : null}
        </SettingsSection>

        <SettingsSection label="Advanced">
          <StepperField
            label="Max LLM calls per session"
            max={50}
            min={1}
            onChange={(value) =>
              setDraft((current) =>
                current
                  ? { ...current, maxLlmCallsPerSession: value }
                  : current,
              )
            }
            value={draft.maxLlmCallsPerSession}
          />

          <StepperField
            label="Annotation cache duration"
            max={90}
            min={1}
            onChange={(value) =>
              setDraft((current) =>
                current ? { ...current, annotationCacheDays: value } : current,
              )
            }
            suffix="days"
            value={draft.annotationCacheDays}
          />

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-(--text-primary)">
                Clear annotation cache
              </p>
              <p className="text-[13px] text-(--text-secondary)">
                Removes saved annotation responses and forces fresh lookups next
                time.
              </p>
            </div>
            <Button
              className="h-auto min-h-9 shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-[13px] leading-none"
              disabled={isClearingCache}
              onClick={() => setIsClearCacheDialogOpen(true)}
              type="button"
              variant="danger"
            >
              Clear annotation cache
            </Button>
          </div>

          {advancedMessage ? (
            <p
              aria-live="polite"
              className="text-[13px] text-(--text-secondary)"
            >
              {advancedMessage}
            </p>
          ) : null}
        </SettingsSection>

        {isSaving ? (
          <p aria-live="polite" className="text-[13px] text-(--text-secondary)">
            Saving changes locally...
          </p>
        ) : null}

        {saveError ? (
          <p aria-live="polite" className="text-[13px] text-(--danger)">
            {saveError}
          </p>
        ) : null}
      </div>

      <Dialog onOpenChange={setIsReseedDialogOpen} open={isReseedDialogOpen}>
        <DialogContent className="w-full max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Re-seed known words?</DialogTitle>
            <DialogDescription>
              This adds the {selectedLevelLabel} starter words back into your
              known-word list. Existing matches stay intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsReseedDialogOpen(false)}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={isReseedingWords}
              onClick={() => void handleReseedKnownWords()}
              type="button"
              variant="primary"
            >
              {isReseedingWords ? "Re-seeding..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={setIsClearCacheDialogOpen}
        open={isClearCacheDialogOpen}
      >
        <DialogContent className="w-full max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Clear annotation cache?</DialogTitle>
            <DialogDescription>
              This removes saved annotation responses from local storage. Fresh
              lookups may use more LLM calls until the cache fills again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsClearCacheDialogOpen(false)}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={isClearingCache}
              onClick={() => void handleClearAnnotationCache()}
              type="button"
              variant="danger"
            >
              {isClearingCache ? "Clearing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );

  async function handleOpenAiValidation() {
    setIsTestingOpenAi(true);

    try {
      const result = await window.sona.settings.validateOpenAiKey();
      setOpenAiStatusMessage(result.message);
    } finally {
      setIsTestingOpenAi(false);
    }
  }

  async function handleOpenRouterValidation() {
    setIsTestingOpenRouter(true);

    try {
      const result = await window.sona.settings.validateOpenRouterKey();
      setOpenRouterStatusMessage(result.message);
    } finally {
      setIsTestingOpenRouter(false);
    }
  }

  async function handlePreviewVoice() {
    if (!draft) {
      return;
    }

    setIsPreviewingVoice(true);

    try {
      const result = await window.sona.settings.previewTtsVoice({
        voice: draft.selectedVoice,
      });

      setPreviewMessage(result.message);
      await playPreview(result);
    } finally {
      setIsPreviewingVoice(false);
    }
  }

  async function handleReseedKnownWords() {
    if (!draft) {
      return;
    }

    const seedPack = KNOWN_WORD_SEED_PACKS_BY_ID.get(draft.koreanLevel);
    if (!seedPack) {
      setGeneralMessage("No known-word seed pack is available for this level.");
      setIsReseedDialogOpen(false);
      return;
    }

    setIsReseedingWords(true);

    try {
      const result = await window.sona.review.completeKnownWordOnboarding({
        seedPackId: seedPack.id,
        selectedWords: seedPack.words,
      });
      setGeneralMessage(
        `Added ${result.insertedCount} known words from ${seedPack.label}.`,
      );
      setIsReseedDialogOpen(false);
    } catch {
      setGeneralMessage("Known words could not be re-seeded right now.");
    } finally {
      setIsReseedingWords(false);
    }
  }

  async function handleClearAnnotationCache() {
    setIsClearingCache(true);

    try {
      const result = await window.sona.settings.clearAnnotationCache();
      setAdvancedMessage(
        result.removedEntries > 0
          ? `Removed ${result.removedEntries} cached annotation entries.`
          : "Annotation cache is already clear.",
      );
      setIsClearCacheDialogOpen(false);
    } catch {
      setAdvancedMessage("Annotation cache could not be cleared.");
    } finally {
      setIsClearingCache(false);
    }
  }

  async function playPreview(result: PreviewTtsVoiceResult) {
    if (!result.ok || !result.audioDataUrl) {
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(result.audioDataUrl);
    audioRef.current = audio;

    try {
      await audio.play();
    } catch {
      setPreviewMessage(
        "Voice preview is ready, but playback could not start automatically.",
      );
    }
  }
}

function ApiKeyRow({
  actionLabel,
  inputId,
  isBusy,
  label,
  onTest,
  onToggleVisibility,
  onValueChange,
  placeholder,
  showValue,
  statusMessage,
  toggleLabel,
  value,
}: {
  actionLabel: string;
  inputId: string;
  isBusy: boolean;
  label: string;
  onTest: () => void;
  onToggleVisibility: () => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  showValue: boolean;
  statusMessage: string;
  toggleLabel: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <label
        className="text-[14px] font-medium text-(--text-primary)"
        htmlFor={inputId}
      >
        {label}
      </label>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center rounded-xl border border-(--border) bg-(--bg-base)">
          <input
            autoComplete="new-password"
            className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-[14px] text-(--text-primary) outline-none placeholder:text-(--text-muted)"
            id={inputId}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={placeholder}
            type={showValue ? "text" : "password"}
            value={value}
          />
          <button
            aria-label={toggleLabel}
            className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-(--text-secondary) transition-colors duration-150 hover:bg-(--bg-elevated) hover:text-(--text-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
            onClick={onToggleVisibility}
            type="button"
          >
            {showValue ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>
        <Button
          className="rounded-full px-4"
          disabled={isBusy}
          onClick={onTest}
          type="button"
          variant="secondary"
        >
          {actionLabel}
        </Button>
      </div>
      <p aria-live="polite" className="text-[13px] text-(--text-secondary)">
        {statusMessage}
      </p>
    </div>
  );
}

function SettingsSection({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <section className="space-y-5 border-b border-(--border) pb-8 last:border-b-0 last:pb-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-(--text-muted)">
        {label}
      </p>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function StepperField({
  label,
  max,
  min,
  onChange,
  suffix,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  suffix?: string;
  value: number;
}) {
  const [inputValue, setInputValue] = useState(() => String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-[14px] font-medium text-(--text-primary)">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-full border border-(--border) bg-(--bg-base) p-1">
        <button
          aria-label={`Decrease ${label}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-(--text-secondary) transition-colors duration-150 hover:bg-(--bg-elevated) hover:text-(--text-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
          onClick={() => onChange(Math.max(min, value - 1))}
          type="button"
        >
          <Minus aria-hidden="true" className="h-4 w-4" />
        </button>
        <label className="sr-only" htmlFor={`${label}-input`}>
          {label}
        </label>
        <input
          className="w-20 bg-transparent text-center text-[14px] font-medium text-(--text-primary) outline-none"
          id={`${label}-input`}
          inputMode="numeric"
          max={max}
          min={min}
          onChange={(event) => {
            setInputValue(event.target.value);

            const parsedValue = Number.parseInt(event.target.value, 10);
            if (Number.isFinite(parsedValue)) {
              onChange(Math.max(min, Math.min(max, parsedValue)));
            }
          }}
          type="text"
          value={inputValue}
        />
        {suffix ? (
          <span className="pr-2 text-[13px] text-(--text-secondary)">
            {suffix}
          </span>
        ) : null}
        <button
          aria-label={`Increase ${label}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-(--text-secondary) transition-colors duration-150 hover:bg-(--bg-elevated) hover:text-(--text-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
          onClick={() => onChange(Math.min(max, value + 1))}
          type="button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function buildSavePayload(
  draft: SettingsDraft,
  touchedKeys: KeyTouchState,
): SaveStudyPreferencesInput {
  return {
    selectedVoice: draft.selectedVoice,
    dailyGoal: draft.dailyGoal,
    koreanLevel: draft.koreanLevel,
    maxLlmCallsPerSession: draft.maxLlmCallsPerSession,
    annotationCacheDays: draft.annotationCacheDays,
    ...(touchedKeys.openAi
      ? { openAiApiKey: normalizeApiKey(draft.openAiApiKey) }
      : {}),
    ...(touchedKeys.openRouter
      ? { openRouterApiKey: normalizeApiKey(draft.openRouterApiKey) }
      : {}),
  };
}

function getPayloadSignature(payload: SaveStudyPreferencesInput): string {
  return JSON.stringify(payload);
}

function getKeyStatusMessage(
  status: ProviderKeyStatus,
  providerLabel: string,
): string {
  if (!status.configured) {
    return `${providerLabel} key not added yet.`;
  }

  if (status.lastValidationState === "success") {
    return `${providerLabel} key is ready.`;
  }

  if (status.lastValidationState === "failed") {
    return `${providerLabel} key needs attention.`;
  }

  return "Saved locally. Test to verify.";
}

function normalizeApiKey(value: string): string | null {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}
