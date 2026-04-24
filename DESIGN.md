# Sona — Design Instructions

> These instructions are authoritative design context for AI coding assistants working on Sona.
> Follow them precisely. Do not deviate without explicit instruction from the project owner.

---

## Identity

**Sona** is a Korean language learning desktop app. The name has a soft, Korean-adjacent feel.
The design must feel calm, focused, and premium — closer to Notion or Linear than to Duolingo.
This is a tool for extended daily study sessions, so the UI should stay out of the way.

---

## Color Palette

### Dark Mode (Default)

| Role | Token | Value |
|---|---|---|
| Background | `--bg-base` | `#0F1117` |
| Surface (cards, panels) | `--bg-surface` | `#1A1D27` |
| Surface elevated | `--bg-elevated` | `#22263A` |
| Border | `--border` | `#2E3248` |
| Text primary | `--text-primary` | `#E8EAF0` |
| Text secondary | `--text-secondary` | `#8B90A8` |
| Text muted | `--text-muted` | `#555A72` |
| Accent (primary) | `--accent` | `#6C8EF5` — soft blue-violet |
| Accent hover | `--accent-hover` | `#8AA5FF` |
| Accent subtle (bg tint) | `--accent-subtle` | `#6C8EF514` |
| Success | `--success` | `#4ECDA4` |
| Warning | `--warning` | `#F5A623` |
| Danger | `--danger` | `#E05C5C` |

### Light Mode

| Role | Token | Value |
|---|---|---|
| Background | `--bg-base` | `#F7F7FA` |
| Surface | `--bg-surface` | `#FFFFFF` |
| Surface elevated | `--bg-elevated` | `#EFEFF4` |
| Border | `--border` | `#E0E2ED` |
| Text primary | `--text-primary` | `#1A1D27` |
| Text secondary | `--text-secondary` | `#5A5F7A` |
| Text muted | `--text-muted` | `#9399B2` |
| Accent | `--accent` | `#4A6CF5` |
| Accent hover | `--accent-hover` | `#3355E0` |
| Accent subtle | `--accent-subtle` | `#4A6CF510` |

> Always implement both modes. Dark is the default. Respect `prefers-color-scheme` and expose a manual toggle in Settings.

---

## Typography

### Primary Font: Pretendard

Pretendard is the primary font for all UI text. It handles Korean (Hangul) and Latin characters
elegantly in a single typeface — critical for a mixed-language app.

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale

| Role | Size | Weight | Usage |
|---|---|---|---|
| Display | 28px | 700 | Screen titles, splash |
| Heading 1 | 22px | 600 | Section headers |
| Heading 2 | 18px | 600 | Card titles, subsections |
| Body | 15px | 400 | General UI text |
| Body emphasis | 15px | 500 | Labels, button text |
| Small | 13px | 400 | Captions, metadata |
| Micro | 11px | 500 | Badges, tags |

### Korean Content Text

For the reading lesson view (where Korean sentences are displayed for study), use a larger,
more generous size to aid readability:

```css
/* Korean sentence display */
font-size: 20px;
line-height: 1.8;
letter-spacing: 0.02em;
font-weight: 400;
```

```css
/* Korean vocabulary cards */
font-size: 32px;
line-height: 1.4;
font-weight: 500;
```

---

## Spacing & Layout

- Base unit: `4px`
- Use multiples: `4, 8, 12, 16, 24, 32, 48, 64`
- Content max-width in main panel: `720px` (reading view), `560px` (SRS review)
- Sidebar width: `220px` (collapsed: `56px`)
- Border radius: `8px` (cards), `6px` (buttons/inputs), `4px` (badges), `12px` (modals)

---

## Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (220px)  │  Main Content Area               │
│                   │                                  │
│  • Dashboard      │  [Active screen renders here]    │
│  • Library        │                                  │
│  • Review (SRS)   │                                  │
│  • Settings       │                                  │
│                   │                                  │
│  ─────────────    │                                  │
│  [User / Streak]  │                                  │
└─────────────────────────────────────────────────────┘
```

The sidebar is always visible on desktop. No hamburger menu needed.

#### Sidebar Header

```
┌─────────────────────────┐
│  [icon 32px]  Sona      │  ← app icon left, "Sona" 16px weight 700 --text-primary
└─────────────────────────┘
```

- Padding: `20px 16px`
- No label above the app name (no "STUDY SHELL" or any category label)
- App icon: rounded square, 32px, `--accent` background, white 소 character or star motif

#### Navigation Items

```
┌─────────────────────────┐
│ ■  Dashboard            │  ← inactive
│─────────────────────────│
│▌■  Library              │  ← active: --accent left border 2px, --accent-subtle bg
│─────────────────────────│
│ ■  Review          [12] │  ← inactive with due count badge
│─────────────────────────│
│ ■  Settings             │  ← inactive
└─────────────────────────┘
```

- Item height: `40px`, padding: `0 16px`, border-radius: `6px`, margin: `2px 8px`
- Icon: Lucide, 20px, `--text-muted` when inactive, `--accent` when active
  - Dashboard: `LayoutDashboard`
  - Library: `BookOpen`
  - Review: `Brain`
  - Settings: `Settings`
- Label: 14px, weight 500, `--text-secondary` when inactive, `--text-primary` when active
- Active state: `--accent-subtle` background, `2px solid --accent` left border, label and icon use active colors
- Hover (inactive only): `--bg-surface` background, `--text-primary` label
- Due count badge (Review only): small pill, `--accent` background, white text, 11px weight 600, padding `2px 6px`, border-radius `10px`. Hidden when count is 0. Never show a number on any other nav item.
- No sequential numbers (01, 02, 03, 04) — do not add any numbers to nav items

---

## Key Screens

### 0. Onboarding (First Launch)

Shown only on first launch (`onboarding_complete: false` in settings). Replaces the entire app window — no sidebar, no navigation. Three steps with a progress indicator. Every step has a "Skip" option.

#### Overall Structure

```
┌──────────────────────────────────────────────────────┐
│                    ● ○ ○                             │  ← step dots, centered top
│                                                      │
│                                                      │
│                  [step content]                      │  ← centered vertically
│                                                      │
│                                                      │
│         [Skip]              [Continue →]             │  ← footer actions
└──────────────────────────────────────────────────────┘
```

- Background: `--bg-base`. No sidebar. No window chrome beyond the standard title bar.
- Step dots: 3 dots, 8px diameter, `gap: 8px`. Active: `--accent`. Inactive: `--border`.
- "Skip" button: Ghost style, left-aligned in footer
- "Continue" button: Primary style, right-aligned in footer, Lucide `ArrowRight` icon after label
- Page transition between steps: fade + translate-x 16px → 0, `200ms ease`

#### Step 1 — Welcome

```
        소

    Welcome to Sona

    Your personal Korean reading and
    review companion. Study at your
    own pace, with content you choose.

    [Continue →]
```

- 소 character: 64px, weight 700, `--accent` color — decorative, centered
- Title: 28px weight 700 `--text-primary`, centered
- Body: 15px `--text-secondary`, centered, max-width `360px`, line-height 1.7
- No illustration, no mascot, no animation beyond the page transition

#### Step 2 — Korean Level

```
    What's your Korean level?

    We'll use this to skip words you
    already know when you start reading.

    [Complete beginner]
    [초급  TOPIK 1–2]
    [중급  TOPIK 3–4]
    [고급  TOPIK 5–6]
```

- Title: 22px weight 600 `--text-primary`, centered
- Sublabel: 14px `--text-secondary`, centered, max-width `320px`
- Level options: vertical stack of selectable rows, `gap: 8px`, max-width `400px`, centered
- Each row: `--bg-surface` bg, `1px solid --border` border, `8px` radius, `14px 20px` padding, 15px weight 500 `--text-primary`. Selected: `--accent-subtle` bg, `1px solid --accent` border.
- TOPIK level rows show the Korean label left + level range right in `--text-muted`
- One selection required to enable "Continue" — default is "Complete beginner"

#### Step 3 — API Keys

```
    Set up your API keys

    Sona uses AI for word lookup and
    audio. Both keys stay on your device.

    OpenRouter API Key  (LLM · word lookup)
    ┌──────────────────────────────┐ [Test]
    │                              │
    └──────────────────────────────┘
    Get your key at openrouter.ai

    OpenAI API Key  (TTS · audio)
    ┌──────────────────────────────┐ [Test]
    │                              │
    └──────────────────────────────┘
    Get your key at platform.openai.com
```

- Title: 22px weight 600, centered
- Sublabel: 14px `--text-secondary`, centered, max-width `360px`
- Key fields: same pattern as Settings — masked input, show/hide toggle, Test button
- "Skip" on this step shows a note: "You can add keys later in Settings. Word lookup and audio won't work until keys are configured."
- Keys are not required to complete onboarding — the app is fully usable for text reading without them

---

### 1. Dashboard

Calm and informational. No celebrations, no motivational copy. Just the data the learner needs to decide what to do next.

#### Overall Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Good morning                                                │  ← greeting, --text-muted 14px
│                                                              │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │  12                     │  │  Continue reading         │  │
│  │  cards due today        │  │  카페에서 커피 주문하기    │  │
│  │                         │  │  [Continue →]            │  │
│  │  [Start Review]         │  └──────────────────────────┘  │
│  └─────────────────────────┘                                 │
│                                                              │
│  This week                                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [bar chart — 7 days]                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Recently added                                              │
│  반갑습니다 · Nice to meet you                               │
│  주문하다 · to order                                         │
│  ···                                                         │
└──────────────────────────────────────────────────────────────┘
```

#### Greeting

- "Good morning" / "Good afternoon" / "Good evening" based on local time — 14px `--text-muted`, no name (app doesn't know the user's name)
- If no activity ever: replace with "Welcome to Sona" — shown only on the very first open

#### Review Count Card

- Background: `--bg-surface`, border: `1px solid --border`, border-radius: `8px`, padding: `24px`
- Count: 48px weight 700 `--accent` — large and prominent
- Label: "cards due today" — 14px `--text-secondary` below the count
- "Start Review" button: Primary style, `margin-top: 16px`
- If count is 0: count shows "0" in `--text-muted`, label changes to "You're all caught up", button changes to "Browse Library" (Secondary style)

#### Continue Reading Card

- Background: `--bg-surface`, border: `1px solid --border`, border-radius: `8px`, padding: `24px`
- Label: "Continue reading" — 11px weight 500 `--text-muted` ALL CAPS
- Content title: 16px weight 600 `--text-primary`, single line with ellipsis
- "Continue" button: Secondary style with Lucide `ArrowRight` icon
- If no content ever opened: card shows "Start reading" label, "Browse Library" button — no content title

#### Weekly Activity Chart

- Section label: "This week" — 13px weight 500 `--text-secondary`
- Recharts `BarChart`, 7 bars (Mon–Sun), height `80px`
- Bar color: `--accent`, bar-radius: `4px` on top corners
- No axis labels, no gridlines, no legend. Bars only.
- Today's bar: `--accent` at full opacity. Past days: `--accent` at 50%. Future days: `--border`.
- If no activity: all bars at zero height — show the empty chart, no placeholder text

#### Streak

- Displayed as a single line below the greeting: Lucide `Flame` icon (16px, `--warning`) + "7 day streak" in 13px `--text-secondary`
- Only shown when streak ≥ 2 days. Hidden when streak is 0 or 1 — no "0 day streak" label.
- No banner, no celebration, no prominent placement. Subtle and informational only.

#### Recently Added Vocabulary

- Section label: "Recently added" — 13px weight 500 `--text-secondary`
- List of last 5 words added to deck, each row: Korean word (15px weight 500 `--text-primary`) + `·` separator + English gloss (15px `--text-secondary`). One row per word, `gap: 8px`.
- If no words yet: "Words you add while reading will appear here." in 14px `--text-muted`
- No "See all" link — Dashboard is a summary, not a list manager

### 2. Reading View

The most important screen. Must feel like a clean reading environment — closer to a Kindle or a well-designed article page than a language app. The UI chrome should be invisible; only the Korean text and the word popup demand attention.

#### Overall Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back          카페에서 커피 주문하기            [초급 badge] │  ← header bar
│──────────────────────────────────────────────────────────────│
│                                                              │
│                   아메리카노 주세요.                           │
│                                                              │
│                   따뜻한 라떼 하나 주문할게요.                  │  ← reading body
│                                                              │
│                   커피 한 잔 주세요.                           │
│                                                              │
│                        ...                                   │
│                                                              │
│──────────────────────────────────────────────────────────────│
│  ▶  ↺   ————————————————●————————  0.8×  1×  1.25×          │  ← audio bar (pinned bottom)
└──────────────────────────────────────────────────────────────┘
```

#### Header Bar

- Height: `52px`, background `--bg-base`, bottom border `1px solid --border`
- Left: back arrow (Lucide `ArrowLeft`, 20px, Ghost button) — navigates back to Library
- Center: content title, 16px weight 600 `--text-primary`, truncated with ellipsis if too long
- Right: difficulty badge (`초급` / `중급` / `고급`) — same badge style as Library cards
- No other controls in the header. No debug info, no block counters, no source type label.

#### Reading Body

- Centered column, max-width `720px`, horizontal margin auto
- Padding: `48px` top, `120px` bottom (leaves room for the pinned audio bar)
- All ContentBlock sentences render as a **single continuous flow of text** — not as separate cards, not as numbered blocks. No "BLOCK 1", "BLOCK 2" labels. No "Make active" buttons. The text reads like a document.
- Sentence spacing: `margin-bottom: 24px` between sentences
- Korean text: Pretendard, 20px, weight 400, line-height 1.8, `--text-primary`
- Romanization (when toggled on): renders on its own line directly below the Korean sentence, 14px italic `--text-secondary`, line-height 1.4

#### Karaoke Highlight

As TTS audio plays, the currently spoken word is highlighted inline within the flowing text:
- Background: `--accent-subtle` (`#6C8EF514`)
- Text color: `--accent`
- Border-radius: `4px`, padding: `0 2px`
- Transition: `80ms linear` — advances word by word as audio plays
- Only one word highlighted at a time. No sentence-level highlight, no block-level highlight.
- When audio is paused or stopped, highlight is removed entirely.

#### Tap-to-Lookup Popup

Tapping any word (whether audio is playing or not) opens an inline popup anchored below the tapped word.

**Critical positioning rules — read carefully:**
- The popup must use `position: absolute` (or `position: fixed`) with a high `z-index` (at least `100`). It floats above all other content.
- It must **never** affect page layout. It must **never** cause a scrollbar to appear. It must **never** push other elements down.
- The reading body's `overflow` must remain `auto` — the popup must not interact with scroll at all.
- Anchor the popup to the bounding rect of the tapped word element using `getBoundingClientRect()`. Position it below the word by default; if the word is near the bottom of the viewport, flip it above.
- The popup renders inside a React portal (`ReactDOM.createPortal`) attached to `document.body` — not inside the reading text container. This is the only way to guarantee it doesn't affect layout.

```
┌─────────────────────────────────────┐
│  줄래?                        [✕]   │  ← tapped word (18px 600) + close button
│  jul-lae                            │  ← romanization (13px italic --text-secondary)
│                                     │
│  Will you (do something for me)?    │  ← construction meaning (15px --text-primary)
│  ─────────────────────────────────  │  ← divider
│  -(아/어) 줄래? · Request · Informal │  ← grammar pattern · register (13px --text-muted)
│                                     │
│  "Will you take me to a place my    │  ← full sentence translation (13px --text-secondary
│  poor imagination can't picture?"   │     italic, max 3 lines)
│                                     │
│  [Explain grammar]  [Add to deck +] │  ← two action buttons
└─────────────────────────────────────┘
```

- Width: `280px`, background `--bg-elevated`, border `1px solid --border`, border-radius `8px`, padding `16px`
- Shadow: `0 4px 16px rgba(0,0,0,0.4)`
- Animate in: fade + translate-y 8px → 0, `150ms ease`
- Dismiss: click outside the popup, or tap the `✕` button

**Annotation is sentence-contextual, not word-isolated.** The LLM receives the full sentence alongside the tapped word and explains the word *in the context of that sentence*. This is essential for Korean — grammatical constructions like -(아/어) 줄래?, -(으)론, -(ㄹ) 수 없다 are meaningless without sentence context. The popup always shows:
1. The tapped surface form (as it appears in the text)
2. Its romanization
3. The meaning of the word/construction in this sentence — not a dictionary definition
4. The grammatical pattern it belongs to, and register
5. A natural English translation of the full sentence — so the learner can verify their understanding of the whole, not just the tapped word

**Do not show:** "Source model", model name, internal IDs, canonical form separately, or any debug metadata.

**Do not use a grid or table layout** — render as a simple vertical stack in this exact order: tapped form → romanization → construction meaning → divider → grammar pattern line → sentence translation → action buttons.

- "Explain grammar" is a Ghost button — triggers a deeper LLM call, expands the popup downward with a grammar note (see below)
- "Add to deck +" is a Secondary button — adds the word to `srs_cards`. Changes to "✓ Added" (disabled, `--success` color) after tap. If word is already in deck or in `known_words`, shows "Already known" (disabled, muted) from the start.
- The popup grows downward when grammar is expanded — it does not reposition or jump
- Only one popup open at a time — tapping a new word closes the previous popup instantly

#### Grammar Explanation (expanded popup)

When "Explain grammar" is tapped, the popup expands below the divider:

```
│  ─────────────────────────────────  │
│  Grammar note                       │  ← 11px weight 500 --text-muted ALL CAPS
│                                     │
│  주문하다 is a transitive verb...    │  ← LLM explanation, 14px --text-primary,
│  commonly used with -을/를...        │     line-height 1.6, max 4 sentences
│                                     │
│  Usage: 커피를 주문하다              │  ← example, 14px --text-secondary italic
└─────────────────────────────────────┘
```

- While loading: show a subtle shimmer placeholder (2 lines) inside the expanded area — not a spinner
- If LLM call fails: show "Couldn't load explanation. Tap to retry." in `--text-muted`, 13px

#### Audio Bar (pinned bottom)

Pinned to the bottom of the main content area (not the window — it scrolls with the content area but sticks to the bottom edge). Height `56px`, background `--bg-surface`, top border `1px solid --border`.

```
  ▶  ↺    ─────────────●────────────    0.75×  1×  1.25×
```

- Play/pause: Lucide `Play` / `Pause`, 20px, Ghost button, `width: 36px height: 36px`
- Replay sentence: Lucide `RotateCcw`, 16px, Ghost button — replays the current sentence from its start
- Progress scrubber: a simple range input, `--accent` for the filled portion, `--border` for the track. No timestamp labels, no time display. The scrubber communicates position visually, not numerically.
- Speed: three pill buttons (`0.75×` · `1×` · `1.25×`). Active pill: `--accent` background, white text. Inactive: Ghost style. No dropdown.
- No "Scrub audio" label. No "Cached block audio is ready." status message. No debug panel. No side panel of any kind.
- If TTS is not configured (no OpenAI key): the audio bar is hidden entirely. The reading view works in text-only mode with no audio controls visible.

#### Empty / Loading States

- On first open of a ContentBlock: show the Korean text immediately (never wait for TTS to render text). Audio bar shows a loading state (play button disabled, progress bar grayed out) while TTS generates. Once audio is ready the play button becomes active — no full-screen loader.
- If TTS generation fails: audio bar shows a subtle "Audio unavailable" label (13px `--text-muted`) with a Lucide `RefreshCw` retry icon. Text reading continues to work normally.

### 3. SRS Review (Flashcard)

A calm, focused review environment. Single column, no sidebars, no panels. The card is the only thing that matters.

#### Overall Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← progress bar (4px)
│                                                              │
│  Daily Review                               12 cards left   │  ← header
│                                                              │
│              ┌──────────────────────────┐                   │
│              │                          │                   │
│              │      반갑습니다           │                   │  ← card front (Korean only)
│              │                          │                   │
│              │   [Reveal answer]        │                   │
│              └──────────────────────────┘                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

After flip:

```
│              ┌──────────────────────────┐                   │
│              │  반갑습니다               │                   │  ← Korean (smaller, top)
│              │  bangapseumnida           │                   │  ← romanization
│              │  ─────────────────────   │                   │
│              │  Nice to meet you.        │                   │  ← English meaning
│              │                          │                   │
│              │  반가워요, 처음 뵙겠습니다  │                   │  ← example sentence
│              │  (Nice to meet you,      │                   │  ← sentence translation
│              │  formal context)         │                   │
│              └──────────────────────────┘                   │
│                                                              │
│         [다시]    [어려움]    [좋음]    [쉬움]               │  ← rating buttons
│         Again      Hard       Good      Easy                │
```

#### Progress Bar

- Height: `4px`, full width of the content area, no border-radius
- Filled portion: `--accent`
- Unfilled portion: `--border`
- No number label on the bar. No percentage text.
- Sits flush at the very top of the content area, above all other elements

#### Header

- "Daily Review" — 22px weight 600 `--text-primary`, left-aligned
- Cards remaining — 13px `--text-secondary` right-aligned, e.g. "12 cards left". Updates after each rating.
- No instructional paragraph. No "Work the oldest due cards first" copy. No explanatory text of any kind.

#### Card

- Max-width: `560px`, centered horizontally, margin auto
- Background: `--bg-surface`, border: `1px solid --border`, border-radius: `12px`, padding: `40px`
- Shadow: `0 2px 8px rgba(0,0,0,0.25)`
- **Card front:** Korean text only — no romanization, no English, no hints. The learner must attempt recall before flipping.
  - Korean: Pretendard, 32px (vocabulary) or 20px (sentence), weight 500, `--text-primary`, centered
  - "Reveal answer" button: Primary style, centered below the Korean text, `margin-top: 32px`
- **Card back (after flip):**
  - Korean: 20px weight 500 `--text-primary` (reduced from front size)
  - Romanization: 14px italic `--text-secondary`, directly below Korean
  - Divider: `1px solid --border`, `margin: 16px 0`
  - English meaning: 18px weight 500 `--text-primary`
  - Example sentence: 14px `--text-secondary`, Korean sentence from original reading context
  - Example translation: 13px italic `--text-muted`
- **Do not show:** FSRS state labels ("LEARNING", "REVIEW", "NEW"), due date, card ID, "DUE NOW" label, or any internal scheduler data
- **Do not show romanization on the card front** — it removes the recall challenge

#### Card Flip Animation

- Framer Motion `rotateY`: front 0° → 180°, back starts at -180° → 0°
- Duration: `300ms`, easing: `ease`
- `backfaceVisibility: hidden` on both faces — prevents seeing through the card mid-flip
- No bounce, no spring

#### Rating Buttons

Appear below the card only after the card is flipped. Hidden before flip.

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  다시     │ │  어려움   │ │  좋음    │ │  쉬움    │
│  Again   │ │  Hard    │ │  Good    │ │  Easy    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

- Layout: 4-column grid, equal width, `gap: 8px`, max-width `560px`, centered
- Height: `56px` (tall enough for two lines of text)
- Korean label: 15px weight 600, top line
- English subtitle: 12px weight 400 `--text-muted`, bottom line
- Colors:
  - 다시 (Again): `--danger` at 15% bg, `--danger` text. Hover: `--danger` at 25% bg
  - 어려움 (Hard): `--warning` at 15% bg, `--warning` text. Hover: `--warning` at 25% bg
  - 좋음 (Good): `--accent` bg, white text. Hover: `--accent-hover` bg
  - 쉬움 (Easy): `--success` at 15% bg, `--success` text. Hover: `--success` at 25% bg
- Border-radius: `8px`. No border. Transition: `120ms ease`.
- Animate in after flip: fade + translate-y 8px → 0, `150ms ease`, `100ms` delay after flip completes

#### Session Complete Screen

When all cards in the session are rated, replace the card with:

```
              [Lucide CheckCircle, 48px, --success]

              Session complete

              You reviewed 12 cards.
              Next session: tomorrow · 8 cards due

              [Back to Dashboard]
```

- Title: 22px weight 600 `--text-primary`, centered
- Body: 15px `--text-secondary`, centered
- Button: Primary style, centered, `margin-top: 32px`
- No confetti. No celebration animation. No streak pop-up. Calm acknowledgment only.

### 4. Content Library

The Library is a two-column layout: a card grid on the left, a detail panel on the right.
The detail panel is hidden until a card is selected.

#### Overall Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Add content]                              [Search library   🔍]│
│                                                                  │
│  Saved content                                                   │
│  3 items in your local library                                   │
│                                                                  │
│  [All]  Articles  Subtitles  Generated                           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  │  ┌─────────────────────┐ │
│  │  Card        │  │  Card        │  │  │  Detail panel       │ │
│  │  (unselected)│  │  (selected)  │  │  │                     │ │
│  └──────────────┘  └──────────────┘  │  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

- Card grid: fluid 2-column grid with `gap: 16px`, fills available width left of the detail panel
- Detail panel: fixed `360px` wide, slides in from the right with `200ms ease` when a card is selected
- When no card is selected, the card grid expands to fill the full width (3-column)
- The divider between grid and panel is `1px solid --border`, no shadow

#### Header Row

- Left: title "Saved content" in Heading 1 (22px, weight 600) with item count below in Small (13px, `--text-secondary`) — e.g. "3 items in your local library"
- Right: "Add content" primary button (36px height, `--accent` background)
- Below the title/button row: search input, full width minus button width, height 36px, placeholder "Search by title or source", Lucide `Search` icon inside left side of input

#### Filter Tabs

Pill-style tabs, not a dropdown. Rendered as a horizontal row below the search input.

```
Active tab:   bg --accent, text white, border-radius 20px, padding 6px 16px, font-size 14px weight 500
Inactive tab: bg transparent, text --text-secondary, border 1px solid --border, same sizing
              Hover: bg --bg-elevated, text --text-primary
```

Tabs: All · Articles · Subtitles · Generated. Switching tabs filters cards with no page reload — no animation needed, instant.

#### Content Card (unselected)

Size: full width of its grid column, height auto (minimum `120px`).

```
┌────────────────────────────────────────┐
│ [icon]  SUBTITLE          [초급 badge] │  ← top row: source icon + type label left, badge right
│         Drama Title                    │  ← title: 18px weight 600, --text-primary
│                                        │
│ 1,603 sentences · ~45 min read         │  ← metadata: 13px --text-secondary
│                                        │
│ [Open]                    [⋯]          │  ← actions: primary button left, overflow menu right
└────────────────────────────────────────┘
```

- Background: `--bg-surface`, border: `1px solid --border`, border-radius: `8px`, padding: `16px 20px`
- Source type label: ALL CAPS, 11px, weight 500, `--text-muted` — e.g. "SUBTITLE", "ARTICLE", "GENERATED"
- Source icon: Lucide `FileText` for articles, `Film` for subtitles, `Sparkles` for generated. Size 16px, color `--text-muted`
- Title: 18px, weight 600, `--text-primary`, single line with ellipsis if too long
- Metadata row: sentence count + estimated read time, separated by `·`, 13px `--text-secondary`
- "Open" button: Secondary style (bg `--bg-elevated`), 32px height, label "Open"
- Overflow `⋯` button: Ghost style, 32px × 32px, Lucide `MoreHorizontal` icon — reveals dropdown with "Delete" (danger color)
- Hover state: border transitions to `--accent` at 40% opacity, `150ms ease`
- No thumbnail image — source icon is the only visual identifier

#### Content Card (selected)

Same as unselected, but:
- Border: `1px solid --accent`
- Background: `--accent-subtle`
- "Open" button changes to Primary style (`--accent` background)
- No hover effect (already selected)

#### Detail Panel

Slides in from right when a card is selected. Fixed width `360px`. Background `--bg-surface`, left border `1px solid --border`. Padding `24px`.

```
┌──────────────────────────────────────┐
│  SUBTITLE                  [✕ close] │  ← type label + close button (Ghost, Lucide X, 20px)
│  Drama Title                         │  ← title: 22px weight 600, --text-primary
│  Subtitle import                     │  ← source method: 13px --text-secondary
│                                      │
│  [초급 badge]   1,603 SENTENCES      │  ← badge + sentence count (13px weight 500 --text-muted ALL CAPS)
│                                      │
│  ──────────────────────────────────  │  ← divider: 1px --border
│                                      │
│  SOURCE DETAILS                      │  ← section label: 11px weight 500 --text-muted ALL CAPS
│  reply.srt                           │  ← filename or URL: 13px --text-primary, monospace for filenames
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  SENTENCE PREVIEW                    │  ← section label
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Sentence 1                     │  │  ← sentence card
│  │ 국민건강증진법에 따른 담배...   │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Sentence 2                     │  │
│  │ 기존 담배사업법은 담배를...     │  │
│  └────────────────────────────────┘  │
│  (scrollable, max 4 sentences shown) │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  [Open]          [Delete]            │  ← primary action left, danger action right
└──────────────────────────────────────┘
```

- Close button: top-right, Ghost style, Lucide `X` icon 20px — collapses the panel, deselects the card
- Section labels: 11px, weight 500, `--text-muted`, ALL CAPS, `margin-bottom: 8px`
- Source detail value: 13px `--text-primary`; filenames in `font-family: monospace`; URLs truncated with ellipsis
- Sentence preview cards: `--bg-elevated` background, `8px` border-radius, `12px 16px` padding, `gap: 8px` between cards
- Sentence text: 15px, weight 400, `--text-primary`, line-height 1.6. No sentence number label, no "NO TIMING METADATA" label — that is internal data, not user-relevant
- Scrollable area contains sentence preview cards only — header and action row stay fixed
- "Open" button: Primary style, full width of its half, opens the reading view for this content
- "Delete" button: Danger style (`--danger` text, `--danger` at 15% bg), triggers a confirmation dialog before deleting

#### Import Modal

Triggered by "Add content" button. A centered dialog, max-width `480px`, border-radius `12px`, background `--bg-surface`, border `1px solid --border`, padding `32px`.

```
┌─────────────────────────────────────────┐
│  Add content                      [✕]   │  ← title 18px 600 + close button
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │  📄           │  │  ✨          │    │  ← two source type tabs
│  │  Import file  │  │  Generate    │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│  --- [ Import tab content ] ---         │
│                                         │
│  [Cancel]              [Import]         │  ← footer actions
└─────────────────────────────────────────┘
```

- Title: 18px weight 600 `--text-primary`
- Close button: Ghost, Lucide `X`, top-right
- Two tabs at top: "Import file" and "Generate". Same pill tab style as Library filter tabs.
- Footer: "Cancel" Ghost button left, primary action button right
- Animate in: fade + scale 0.97 → 1, `150ms ease`. Backdrop: `rgba(0,0,0,0.5)`.

**Import file tab — two sub-options (SRT or paste):**

```
  How would you like to add content?

  ┌─────────────────────────────────┐
  │  🎬  Import SRT subtitle file   │  ← selectable row
  │  Drag a .srt file or browse     │
  └─────────────────────────────────┘
  ┌─────────────────────────────────┐
  │  📋  Paste Korean text          │  ← selectable row
  │  Article, lyrics, or any text   │
  └─────────────────────────────────┘
```

- Sub-option rows: `--bg-elevated` bg, `1px solid --border` border, `8px` radius, `16px` padding. Selected: `--accent-subtle` bg, `1px solid --accent` border.
- Icon: 20px, `--text-muted`
- Label: 15px weight 500 `--text-primary`
- Sublabel: 13px `--text-muted`

When "Import SRT file" selected: show a file drop zone below:
```
  ┌─────────────────────────────────┐
  │                                 │
  │   Drop .srt file here           │
  │   or  [Browse files]            │
  │                                 │
  └─────────────────────────────────┘
```
- Drop zone: `--bg-elevated` bg, `2px dashed --border`, `8px` radius, `80px` height, centered text 14px `--text-muted`
- On file selected: show filename + file size in the drop zone, border changes to `--accent`

When "Paste Korean text" selected: show a textarea below:
```
  ┌─────────────────────────────────┐
  │  Paste Korean text here...      │
  │                                 │
  │                                 │
  └─────────────────────────────────┘
  Title (optional)
  ┌─────────────────────────────────┐
  │                                 │
  └─────────────────────────────────┘
```
- Textarea: height `160px`, `--bg-elevated` bg, `1px solid --border`, `6px` radius, Pretendard 15px, `--text-primary`
- Title input: standard input, 36px height, placeholder "e.g. BBC Korean article"

**Generate tab:**

```
  Topic
  ┌─────────────────────────────────┐
  │  e.g. ordering coffee           │
  └─────────────────────────────────┘

  Difficulty
  [초급]  중급  고급

  Number of sentences
  ┌────────┐
  │  10    │ − +
  └────────┘
```

- Topic: standard text input, placeholder "e.g. ordering coffee, at the airport"
- Difficulty: pill selector, same style as onboarding level selector. Default: 초급.
- Sentence count: number input with stepper, range 5–30, default 10
- Primary button label changes to "Generate" on this tab
- While generating: button shows a subtle loading spinner, label "Generating…". Input fields remain visible but disabled.

#### Sort Controls

Rendered as a row to the right of the filter tabs, right-aligned:

```
Sort: [Date added ▾]
```

- A single dropdown (shadcn/ui Select), 36px height, options: "Date added", "Difficulty", "Read time"
- Label "Sort:" in 13px `--text-muted` before the dropdown
- No sort direction toggle for v1 — always descending (newest/hardest/longest first)

#### Empty State (no content imported yet)

Centered in the content area, vertically and horizontally:

```
    [Lucide BookOpen icon, 48px, --text-muted]

    Your library is empty

    Import a drama subtitle file, paste a Korean article,
    or generate practice sentences to get started.

    [Add content]
```

- Title: 18px, weight 600, `--text-primary`
- Body: 14px, `--text-secondary`, centered, max-width `320px`
- Button: Primary style, centered below the body text, `margin-top: 24px`

#### Empty State (filter returns no results)

Same layout, but:
- Icon: Lucide `SearchX`, 48px, `--text-muted`
- Title: "No results for "[query]""
- Body: "Try a different search term or clear the filter."
- No button — just the message

### 5. Settings

Simple vertical form layout. No tabs, no sidebar navigation within Settings. Max-width `640px`, centered. Sections separated by a section header and a `1px solid --border` divider.

#### Section Header Style

```
GENERAL                              ← 11px weight 500 --text-muted ALL CAPS
──────────────────────────────────   ← 1px --border divider below
```

#### Section: General

- **Daily review goal:** number input with `−` / `+` stepper buttons. Label: "Daily review goal". Sublabel: "Cards per session · default 50" in 13px `--text-muted`.
- **TOPIK level:** pill selector (Complete beginner · 초급 · 중급 · 고급). Active pill: `--accent` bg. Label: "My Korean level". Sublabel: "Used to suppress already-known words from your deck."
- **Re-seed known words:** Ghost button with Lucide `RefreshCw` icon. Label: "Re-seed known words". Sublabel: "Adds words from your selected level to the known list. Does not remove words you've already studied." Triggers a confirmation dialog before running.

#### Section: API Keys

Two separate key fields, same pattern for each:

```
OpenRouter API Key (LLM)
┌──────────────────────────────────┐ [👁] [Test]
│  sk-or-••••••••••••••••••••••   │
└──────────────────────────────────┘
✓ Connected                          ← --success, 13px, shown after successful test
```

- Label above input: "OpenRouter API Key (LLM)" and "OpenAI API Key (TTS)" — clearly labelled with purpose in parentheses
- Input: masked by default (••••), height 36px
- Show/hide toggle: Lucide `Eye` / `EyeOff`, Ghost button, inside input right side
- "Test" button: Secondary style, 36px height, to the right of the input
- After successful test: green checkmark + "Connected" in `--success` below the input
- After failed test: "Connection failed. Check your key." in `--danger` below the input
- Sublabel below each field: "Get your key at openrouter.ai" / "Get your key at platform.openai.com" — 13px `--text-muted`
- Settings are saved immediately on change — no Save button

#### Section: TTS Voice

- **Voice selector:** pill group — alloy · nova · shimmer · echo · fable · onyx. Active pill: `--accent` bg. Wrap to two rows if needed.
- **Preview button:** Ghost button with Lucide `Volume2` icon, label "Preview voice". Plays a short fixed Korean phrase ("안녕하세요, 소나입니다.") in the selected voice. Button shows a subtle loading state while audio generates.

#### Section: Appearance

- **Theme:** three-way toggle — System · Light · Dark. Same pill style as voice selector.
  - System: follows `prefers-color-scheme`
  - Active pill: `--accent` bg, white text

#### Section: Advanced

- **LLM call cap:** number input, label "Max LLM calls per session", sublabel "Prevents runaway API usage. Default: 100."
- **Annotation cache TTL:** number input (days), label "Annotation cache duration", sublabel "Cached annotations older than this are refreshed in the background. Default: 30 days."
- **Clear annotation cache:** Danger Ghost button, label "Clear annotation cache", sublabel "Forces all word annotations to be re-fetched from the LLM. Cannot be undone." Triggers a confirmation dialog.

---

## Components

### Buttons

```
Primary:   bg --accent, text white, hover --accent-hover
Secondary: bg --bg-elevated, text --text-primary, border --border
Ghost:     bg transparent, text --text-secondary, hover bg --bg-surface
Danger:    bg --danger at 15% opacity, text --danger, hover bg --danger at 25%
```

All buttons: `height 36px`, `padding 0 16px`, `border-radius 6px`, `font-weight 500`,
`font-size 14px`. Transition: `150ms ease` on background and color.

### Inputs

- Height: `36px`
- Border: `1px solid --border`
- Background: `--bg-surface`
- Focus ring: `2px solid --accent` (no default browser outline)
- Border radius: `6px`
- Font: Pretendard 14px

### Cards

- Background: `--bg-surface`
- Border: `1px solid --border`
- Border radius: `8px`
- Padding: `20px 24px`
- Subtle shadow (dark mode): `0 1px 3px rgba(0,0,0,0.3)`
- Hover (interactive cards only): border color transitions to `--accent` at 40% opacity

### Badges / Difficulty Tags

```
초급 (Beginner):     bg --success at 15%, text --success
중급 (Intermediate): bg --warning at 15%, text --warning
고급 (Advanced):     bg --danger at 15%, text --danger
```

Font: 11px, weight 500, padding `2px 8px`, border-radius `4px`.

---

## Motion & Animation

Use **Framer Motion** for all animations. Keep motion subtle — this is a study tool, not a game.

| Interaction | Animation |
|---|---|
| Page transition | Fade + translate-y 8px → 0, 200ms ease |
| SRS card flip | 3D rotateY 0° → 180°, 300ms ease |
| Tap-to-lookup popup | Fade + translate-y 8px → 0, 150ms ease |
| Karaoke word highlight | Background color transition, 80ms linear |
| Button press | Scale 0.97, 100ms ease |
| Sidebar collapse | Width transition, 200ms ease |
| Toast notification | Slide in from top-right, 200ms ease |

Do not use bounce or spring animations. Prefer `ease` or `easeOut` timing.

---

## Icons

Use **Lucide React** exclusively for all icons. Do not mix icon libraries.
Icon size: `16px` for inline/UI icons, `20px` for navigation, `24px` for empty states.

---

## Korean Language Specifics

- **Always display difficulty labels in Korean**: 초급, 중급, 고급
- **Romanization** (romanized Korean text) should render in italic, slightly muted (`--text-secondary`)
- **Hangul** characters must never be truncated with ellipsis mid-character — always truncate at word boundaries
- The app logo / splash screen should incorporate a Hangul character as a decorative element
  (suggest: 소 from 소나 as a subtle watermark or geometric motif)

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text (WCAG AA)
- All interactive elements must have visible focus states (use `--accent` focus ring)
- Korean TTS audio must have a visible play/pause control at all times during playback
- Do not rely on color alone to convey meaning (pair color badges with text labels)
- All images and icons must have `aria-label` or `alt` text

---

## What to Avoid

- No gradients on UI surfaces (gradients only acceptable in illustrations or logo)
- No drop shadows heavier than `0 4px 12px rgba(0,0,0,0.2)`
- No full-page modals for small interactions — use inline popups or side panels
- No Duolingo-style gamification chrome (no XP bars, no mascots, no celebration confetti)
- No skeleton loaders with aggressive pulse animations — use a subtle fade
- Do not use emoji in UI text
- Do not use system default fonts — always load Pretendard
