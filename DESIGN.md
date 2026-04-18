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
│  • Lessons        │                                  │
│  • Review (SRS)   │                                  │
│  • Library        │                                  │
│  • Settings       │                                  │
│                   │                                  │
│  ─────────────    │                                  │
│  [User / Streak]  │                                  │
└─────────────────────────────────────────────────────┘
```

The sidebar is always visible on desktop. No hamburger menu needed.
Navigation items have an icon + label. Active state uses `--accent-subtle` background with
`--accent` left border (2px).

---

## Key Screens

### 1. Dashboard

- Today's review count as a prominent number (large, centered card)
- Streak counter with a flame icon
- "Continue lesson" CTA — most prominent button on screen
- Recent vocabulary list (last 5 words added to SRS deck)
- Weekly activity chart (simple bar chart, use Recharts)
- Keep it minimal — no more than 4 information blocks

### 2. Reading View

The most important screen. Must feel like a clean reading environment.

- Full-width Korean text, centered, max 720px
- Generous padding: `48px` top and bottom
- **Tap-to-lookup**: clicking any word opens an inline popup card (not a modal) anchored
  below the tapped word. The card shows: word, romanization, meaning, grammar note.
  Animate in with a subtle fade + translate-y (8px → 0). Dismiss on outside click.
- **Karaoke highlight**: as TTS audio plays, the current word is highlighted with
  `--accent-subtle` background and `--accent` text color. Transitions smoothly word by word.
- Audio controls: a minimal floating bar at the bottom of the content area.
  Play/pause, speed toggle (0.75× / 1× / 1.25×), replay sentence. Do not use a
  heavy media player chrome.
- Difficulty badge top-right: `초급` / `중급` / `고급` (use Korean terms, not English).
  Color: success/warning/danger respectively.

### 3. SRS Review (Flashcard)

- Card centered on screen, max 560px wide
- Front: Korean word or sentence, large (32px for vocabulary, 20px for sentences)
- Back: English meaning, romanization, example sentence
- Flip animation: CSS 3D card flip via Framer Motion, 300ms ease
- After flip, show 4 rating buttons: `다시` (Again) · `어려움` (Hard) · `좋음` (Good) · `쉬움` (Easy)
  Use Korean labels with English subtitles below in smaller text
- Progress bar at top showing remaining cards in session
- Do not show the card count number prominently — keep focus on the card itself

### 4. Content Library

- Grid of content cards (article tiles + SRT imports)
- Each card: thumbnail or Hangul character placeholder, title, difficulty badge,
  source type icon (article vs subtitle), estimated read time
- Filter bar: All / Articles / Subtitles / Generated — as pill tabs, not a dropdown
- Search input at top
- Empty state: friendly illustration + "Import an article or SRT file to get started"

### 5. Settings

- Simple vertical form layout, no tabs
- Sections: General · API Keys · TTS Voice · Study Goals · Appearance
- API key fields: masked input with show/hide toggle and a "Test connection" button
- TTS voice: dropdown with a play button to preview the selected voice
- Study goal: daily review target (number input with stepper)

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
