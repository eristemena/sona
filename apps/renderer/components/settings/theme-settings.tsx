'use client'

import { useEffect, useState } from "react";

import { LaptopMinimal, MoonStar, SunMedium } from 'lucide-react'

import type { ThemePreferenceMode } from '@sona/domain/settings/theme-preference'
import type {
  ReadingAudioMode,
  ReadingAudioVoice,
} from "@sona/domain/settings/reading-audio-preference";

import { useThemePreference } from '../../lib/use-theme-preference'
import { Button } from '../ui/button'

const OPTIONS: Array<{ mode: ThemePreferenceMode; label: string; description: string; icon: typeof LaptopMinimal }> = [
  { mode: 'system', label: 'System', description: 'Follow macOS appearance.', icon: LaptopMinimal },
  { mode: 'dark', label: 'Dark', description: 'Use the calm default palette.', icon: MoonStar },
  { mode: 'light', label: 'Light', description: 'Use the bright reading surface.', icon: SunMedium },
]

const READING_AUDIO_OPTIONS: Array<{
  mode: ReadingAudioMode;
  label: string;
  description: string;
}> = [
  {
    mode: "standard",
    label: "Standard",
    description: "Natural pacing for everyday listening.",
  },
  {
    mode: "learner-slow",
    label: "Learner slow",
    description: "Generate calmer, slower speech for new audio clips.",
  },
];

const READING_AUDIO_VOICE_OPTIONS: Array<{
  voice: ReadingAudioVoice;
  label: string;
  description: string;
}> = [
  {
    voice: "alloy",
    label: "Alloy",
    description: "Balanced and neutral for everyday practice.",
  },
  {
    voice: "coral",
    label: "Coral",
    description: "Warmer and steadier for slower learner listening.",
  },
  {
    voice: "shimmer",
    label: "Shimmer",
    description: "Softer and brighter if you want a lighter tone.",
  },
];

export function ThemeSettings() {
  const { themePreference, resolvedTheme, setThemePreference } = useThemePreference()
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [readingAudioMode, setReadingAudioMode] =
    useState<ReadingAudioMode>("standard");
  const [readingAudioVoice, setReadingAudioVoice] =
    useState<ReadingAudioVoice>("alloy");
  const [readingAudioModeMessage, setReadingAudioModeMessage] = useState(
    "New audio clips use standard pacing by default.",
  );
  const [readingAudioVoiceMessage, setReadingAudioVoiceMessage] = useState(
    "Alloy is active for newly generated reading audio.",
  );
  const [openAiConfigured, setOpenAiConfigured] = useState(false);
  const [openAiStatusMessage, setOpenAiStatusMessage] = useState("");
  const [isSavingOpenAiKey, setIsSavingOpenAiKey] = useState(false);
  const [isSavingReadingAudioMode, setIsSavingReadingAudioMode] =
    useState(false);
  const [isSavingReadingAudioVoice, setIsSavingReadingAudioVoice] =
    useState(false);

  useEffect(() => {
    let active = true;

    if (typeof window === "undefined" || typeof window.sona === "undefined") {
      return () => {
        active = false;
      };
    }

    void window.sona.settings.getOpenAiApiKeyStatus().then((status) => {
      if (!active) {
        return;
      }

      setOpenAiConfigured(status.configured);
      setOpenAiStatusMessage(
        status.configured
          ? "A reading-audio key is stored locally."
          : "No reading-audio key is configured yet.",
      );
    });

    void window.sona.settings.getReadingAudioMode().then((mode) => {
      if (!active) {
        return;
      }

      setReadingAudioMode(mode);
      setReadingAudioModeMessage(
        mode === "learner-slow"
          ? "Learner slow mode is on. Reopen content or retry audio to generate slower new clips."
          : "Standard pacing is active for newly generated reading audio.",
      );
    });

    void window.sona.settings.getReadingAudioVoice().then((voice) => {
      if (!active) {
        return;
      }

      setReadingAudioVoice(voice);
      setReadingAudioVoiceMessage(
        voice === "coral"
          ? "Coral is active for newly generated reading audio."
          : voice === "shimmer"
            ? "Shimmer is active for newly generated reading audio."
            : "Alloy is active for newly generated reading audio.",
      );
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleOpenAiKeySave(nextApiKey = openAiApiKey) {
    if (typeof window === "undefined" || typeof window.sona === "undefined") {
      return;
    }

    setIsSavingOpenAiKey(true);
    try {
      const normalizedKey = nextApiKey.trim();
      const status = await window.sona.settings.setOpenAiApiKey(
        normalizedKey.length > 0 ? normalizedKey : null,
      );
      setOpenAiConfigured(status.configured);
      setOpenAiApiKey("");
      setOpenAiStatusMessage(
        status.configured
          ? "OpenAI reading audio is configured and ready for first-open generation."
          : "OpenAI reading audio was cleared. Reading stays text-first until a key is added again.",
      );
    } catch {
      setOpenAiStatusMessage("The OpenAI key could not be saved right now.");
    } finally {
      setIsSavingOpenAiKey(false);
    }
  }

  async function handleReadingAudioModeChange(nextMode: ReadingAudioMode) {
    if (
      typeof window === "undefined" ||
      typeof window.sona === "undefined" ||
      nextMode === readingAudioMode
    ) {
      return;
    }

    setIsSavingReadingAudioMode(true);
    try {
      const result = await window.sona.settings.setReadingAudioMode(nextMode);
      setReadingAudioMode(result.mode);
      setReadingAudioModeMessage(
        result.mode === "learner-slow"
          ? "Learner slow mode is on. Reopen content or retry audio to generate slower new clips."
          : "Standard pacing is active for newly generated reading audio.",
      );
    } catch {
      setReadingAudioModeMessage(
        "The reading-audio pace could not be updated right now.",
      );
    } finally {
      setIsSavingReadingAudioMode(false);
    }
  }

  async function handleReadingAudioVoiceChange(nextVoice: ReadingAudioVoice) {
    if (
      typeof window === "undefined" ||
      typeof window.sona === "undefined" ||
      nextVoice === readingAudioVoice
    ) {
      return;
    }

    setIsSavingReadingAudioVoice(true);
    try {
      const result = await window.sona.settings.setReadingAudioVoice(nextVoice);
      setReadingAudioVoice(result.voice);
      setReadingAudioVoiceMessage(
        result.voice === "coral"
          ? "Coral is active for newly generated reading audio."
          : result.voice === "shimmer"
            ? "Shimmer is active for newly generated reading audio."
            : "Alloy is active for newly generated reading audio.",
      );
    } catch {
      setReadingAudioVoiceMessage(
        "The reading-audio voice could not be updated right now.",
      );
    } finally {
      setIsSavingReadingAudioVoice(false);
    }
  }

  return (
    <section className="rounded-3xl border border-(--border) bg-(--bg-surface)/80 p-6 shadow-(--shadow-soft) backdrop-blur">
      <div className="space-y-6">
        <section>
          <header className="mb-5 space-y-1">
            <h2 className="text-lg font-semibold text-(--text-primary)">
              Appearance
            </h2>
            <p className="text-sm text-(--text-secondary)">
              Current shell theme:{" "}
              <span className="font-medium text-(--text-primary)">
                {resolvedTheme}
              </span>
            </p>
          </header>
          <div className="grid gap-3 md:grid-cols-3">
            {OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = themePreference === option.mode;

              return (
                <Button
                  aria-pressed={active}
                  className="h-auto items-start justify-start gap-3 rounded-2xl px-4 py-4 text-left"
                  key={option.mode}
                  onClick={() => void setThemePreference(option.mode)}
                  variant={active ? "primary" : "secondary"}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span
                      className={
                        active
                          ? "block text-xs text-white/80"
                          : "block text-xs text-(--text-secondary)"
                      }
                    >
                      {option.description}
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-(--border) bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_68%)] p-5">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-(--text-primary)">
              Reading audio
            </h2>
            <p className="text-sm leading-6 text-(--text-secondary)">
              Store an OpenAI API key locally for direct `gpt-4o-mini-tts`
              reading audio generation, then choose whether newly generated
              clips use standard pacing or a learner-slow delivery. Lookup and
              grammar requests still use the separate OpenRouter path.
            </p>
          </header>

          <div className="mt-4 space-y-3">
            <div className="space-y-3 rounded-2xl border border-(--border) bg-(--bg-surface)/70 p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-(--text-primary)">
                  Speech style
                </p>
                <p className="text-sm leading-6 text-(--text-secondary)">
                  This changes how newly generated reading audio is spoken.
                  Existing cached clips stay as they are until you reopen
                  content or retry audio.
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {READING_AUDIO_OPTIONS.map((option) => {
                  const active = readingAudioMode === option.mode;

                  return (
                    <Button
                      aria-pressed={active}
                      className="h-auto items-start justify-start rounded-2xl px-4 py-3 text-left"
                      disabled={isSavingReadingAudioMode}
                      key={option.mode}
                      onClick={() =>
                        void handleReadingAudioModeChange(option.mode)
                      }
                      variant={active ? "primary" : "secondary"}
                    >
                      <span className="space-y-1">
                        <span className="block text-sm font-semibold">
                          {option.label}
                        </span>
                        <span
                          className={
                            active
                              ? "block text-xs text-white/80"
                              : "block text-xs text-(--text-secondary)"
                          }
                        >
                          {option.description}
                        </span>
                      </span>
                    </Button>
                  );
                })}
              </div>

              <p aria-live="polite" className="text-sm text-(--text-secondary)">
                {readingAudioModeMessage}
              </p>

              <div className="space-y-1 pt-2">
                <p className="text-sm font-medium text-(--text-primary)">
                  Voice
                </p>
                <p className="text-sm leading-6 text-(--text-secondary)">
                  Choose the voice for newly generated clips. Learner slow works
                  with whichever voice you pick.
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                {READING_AUDIO_VOICE_OPTIONS.map((option) => {
                  const active = readingAudioVoice === option.voice;

                  return (
                    <Button
                      aria-pressed={active}
                      className="h-auto items-start justify-start rounded-2xl px-4 py-3 text-left"
                      disabled={isSavingReadingAudioVoice}
                      key={option.voice}
                      onClick={() =>
                        void handleReadingAudioVoiceChange(option.voice)
                      }
                      variant={active ? "primary" : "secondary"}
                    >
                      <span className="space-y-1">
                        <span className="block text-sm font-semibold">
                          {option.label}
                        </span>
                        <span
                          className={
                            active
                              ? "block text-xs text-white/80"
                              : "block text-xs text-(--text-secondary)"
                          }
                        >
                          {option.description}
                        </span>
                      </span>
                    </Button>
                  );
                })}
              </div>

              <p aria-live="polite" className="text-sm text-(--text-secondary)">
                {readingAudioVoiceMessage}
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-(--text-primary)">
                OpenAI API key
              </span>
              <input
                autoComplete="new-password"
                className="w-full rounded-2xl border border-(--border) bg-(--bg-surface) px-4 py-3 text-sm text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:outline-2 focus:outline-offset-2 focus:outline-(--accent)"
                onChange={(event) => setOpenAiApiKey(event.target.value)}
                placeholder={
                  openAiConfigured
                    ? "Replace stored key"
                    : "Paste OpenAI API key"
                }
                type="password"
                value={openAiApiKey}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-2xl px-4"
                disabled={isSavingOpenAiKey}
                onClick={() => void handleOpenAiKeySave()}
                variant="primary"
              >
                {isSavingOpenAiKey
                  ? "Saving..."
                  : openAiConfigured
                    ? "Save replacement"
                    : "Save key"}
              </Button>
              <Button
                className="rounded-2xl px-4"
                disabled={
                  isSavingOpenAiKey ||
                  (!openAiConfigured && openAiApiKey.trim().length === 0)
                }
                onClick={() => {
                  setOpenAiApiKey("");
                  void handleOpenAiKeySave("");
                }}
                variant="secondary"
              >
                Clear key
              </Button>
            </div>

            <p aria-live="polite" className="text-sm text-(--text-secondary)">
              {openAiStatusMessage}
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}