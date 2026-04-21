# Feature Specification: Sync Reading Audio

**Feature Branch**: `[004-sync-reading-audio]`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "When a learner opens a piece of content in Sona, they should be able to read it as flowing Korean text while listening to an audio reading of it. The audio and the text should stay in sync — the word being spoken should be visually highlighted. The learner can tap any word to see what it means and how it is built grammatically. If they want more detail, they can ask for a grammar explanation. Words they want to remember can be added to their review deck directly from the reading view."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read With Synced Audio (Priority: P1)

A learner opens a saved piece of Korean content and studies it in a focused reading view where the text flows naturally while a block-level audio reading plays in sync for the currently active reading block. As the audio advances, the currently spoken word in that active block is highlighted so the learner can track pronunciation and phrasing without losing their place.

**Why this priority**: This is the core learning loop for the feature. Without reliable synced reading and listening, the rest of the workflow has little value.

**Independent Test**: Can be fully tested by opening a content item with available block audio, starting playback for the active reading block, and confirming that the reading view remains usable while the spoken word in that block stays visually aligned with the audio.

**Acceptance Scenarios**:

1. **Given** a learner opens a content item with available audio for the active reading block, **When** playback starts, **Then** the content is shown as continuous Korean reading text and the currently spoken word in that block is visually highlighted as the audio progresses.
2. **Given** a learner pauses, replays, changes speed, or moves to another point in the active block audio, **When** playback position changes, **Then** the highlighted word updates to match the new spoken position without forcing the learner to restart the block.
3. **Given** a learner opens content whose active block does not have usable audio alignment metadata, **When** the reading view loads, **Then** the learner can still read the text and is clearly informed that synced highlighting is unavailable for that block.

---

### User Story 2 - Inspect Words In Context (Priority: P2)

A learner taps any word in the reading view to inspect what it means and how it functions grammatically in the current sentence. If they want more help, they can request a deeper explanation without leaving the reading flow.

**Why this priority**: Learners need immediate comprehension support while reading. In-context inspection is the shortest path from confusion to understanding.

**Independent Test**: Can be fully tested by tapping words during a reading session, confirming that meaning and grammar-oriented details appear in context, and verifying that a richer explanation request returns either more detail or a clear fallback state.

**Acceptance Scenarios**:

1. **Given** a learner taps a word in the reading view, **When** the word is selected, **Then** the learner sees its meaning and a grammar-oriented breakdown in the same reading context.
2. **Given** a learner asks for more grammar detail, **When** richer explanation is available, **Then** the explanation is shown without navigating away from the reading view.
3. **Given** a learner asks for more grammar detail and richer explanation is unavailable, **When** the request completes, **Then** the learner is told that deeper detail is unavailable and can continue reading with the basic word information still visible.

---

### User Story 3 - Save Words For Review (Priority: P3)

A learner can save a word they want to remember directly from the reading view so it becomes part of their review deck with clear source context.

**Why this priority**: Direct capture turns reading moments into durable study material without asking the learner to switch screens or re-find the word later.

**Independent Test**: Can be fully tested by selecting a word from the reading view, adding it to the review deck, and confirming that the saved item keeps source context while respecting duplicate and pacing rules.

**Acceptance Scenarios**:

1. **Given** a learner selects a word that is not already active in their review deck, **When** they choose to add it to review, **Then** the system saves it with the source content and sentence context and confirms the action.
2. **Given** a learner tries to add a word that is already active in review or would exceed the learner's current new-item pacing limit, **When** they confirm the add action, **Then** the system prevents duplicate active work and clearly explains whether the word was already covered or deferred for later review.

### Edge Cases

- Audio playback is available for a block but word-level timing is incomplete, malformed, or drifts partway through the block.
- A learner taps a repeated word that appears multiple times in the visible sentence and expects details for the exact occurrence they selected.
- A learner opens mixed Korean and non-Korean text, punctuation-heavy text, or quoted dialogue and still expects natural reading flow and word selection behavior.
- A learner requests deeper grammar detail while offline or while optional enrichment resources are unavailable.
- A learner adds several words during one reading session and reaches the existing review pacing limit before the session ends.

## Local-First & Learning Load Impact *(mandatory)*

### Local Data & Privacy

- The feature creates or updates local reading-session state, playback position, learner-selected word actions, and learner-approved review additions.
- Any saved review addition created from the reading view remains stored on the local device with its source context.
- Network use is optional only for enhanced explanation or block-audio support when the learner has configured it. Core reading, synced playback for prepared block audio, basic word inspection, and review capture remain usable without mandatory network access.

### Source Material & Provenance

- This flow starts from learner-approved content already saved in Sona, along with any associated block audio made available for that content.
- Every review addition created from the reading view retains its source content and sentence context so the learner can inspect where it came from later through persisted review-card provenance.
- The learner can inspect derived study material in context from the reading view rather than relying on opaque automation.

### Review Load & Recovery

- The feature creates review work only when the learner explicitly adds a word from the reading view.
- Duplicate protection applies before creating new active review work.
- Existing pacing limits continue to bound how many new review items can become active, and any over-limit additions are deferred rather than silently increasing the learner's backlog.

### Reading, Listening, and TTS

- Reading, block audio, and review state stay connected through a shared reading session so the learner can move from listening to lookup to review capture without losing context.
- If audio, timing metadata, pronunciation support, or richer explanation detail is unavailable, the learner can continue in a text-first reading mode with basic word details and review capture still available when possible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST present opened content as continuous Korean reading text in a dedicated reading view that supports block-level audio playback for the currently active reading block.
- **FR-002**: The system MUST keep a visible highlight aligned to the currently spoken word in the active reading block during playback and after pause, replay, speed changes, or learner-initiated navigation to a different playback position within that block.
- **FR-003**: The system MUST allow a learner to select any displayed word and inspect its meaning and grammar-oriented breakdown without leaving the reading view.
- **FR-004**: The system MUST allow a learner to request a deeper grammar explanation for the selected word or phrase and either show the explanation in context or clearly state when richer detail is unavailable.
- **FR-005**: The system MUST allow a learner to add a selected word to the review deck directly from the reading view.
- **FR-006**: The system MUST preserve the source content and sentence context for every review item added from the reading view so that provenance remains queryable and inspectable later.
- **FR-007**: The system MUST prevent duplicate active review items from being created from reading-view selections and MUST apply existing new-item pacing rules before activating newly added review work.
- **FR-008**: The system MUST store reading progress, playback position, learner-selected word actions, and learner-added review items locally so the core workflow remains usable without accounts or mandatory cloud services.
- **FR-009**: The system MUST keep the reading workflow usable when block audio, timing metadata, pronunciation support, token-to-timestamp mapping, or richer explanation detail is unavailable by falling back to text-first reading with clear status messaging.
- **FR-010**: The system MUST support repeated word inspection and review actions during a reading session without interrupting playback unless the learner explicitly chooses to pause.
- **FR-011**: The system MUST request hosted block audio directly from the OpenAI speech API using the `gpt-4o-mini-tts` model by default, with the `openaiApiKey` stored in settings and kept separate from the OpenRouter key used for lookup and grammar calls.
- **FR-011a**: The system MUST let the learner choose between standard pacing and a learner-slow generation mode for newly synthesized reading audio, while keeping playback controls unchanged.

### Key Entities *(include if feature involves data)*

- **Reading Session**: The learner's active interaction with a content item, including current reading position, playback state, highlighted word, and in-view study actions.
- **Audio Alignment Segment**: The mapping between a span of spoken audio and the exact word or phrase currently highlighted in the reading view.
- **Word Insight**: The information attached to a selected word in context, including meaning, grammar-oriented breakdown, deeper explanation availability, and sentence location.
- **Review Addition**: A learner-approved word saved from the reading view, including its source content, sentence context, duplicate status, and pacing state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, learners can open saved content and begin a synced reading session in under 10 seconds for at least 90% of attempts.
- **SC-002**: For active reading blocks with usable word-level alignment, the highlighted word stays on the spoken word or an immediately adjacent word for at least 95% of playback time during validation runs.
- **SC-003**: In usability testing, at least 90% of learners can inspect a word's meaning and grammar details and return to reading without external help on their first attempt.
- **SC-004**: At least 95% of learner-selected review additions are saved with visible source context and without creating duplicate active review items.
- **SC-005**: In fallback testing where audio or richer explanation detail is unavailable, learners can still continue reading and add words to review in 100% of tested scenarios.

## Assumptions

- The primary learner is a self-directed Korean learner using Sona on a desktop device for focused study sessions.
- Content used in this flow has already been imported into the learner's local library and approved for study.
- Basic word meaning and grammar-oriented breakdown can come from locally available resources, while richer explanations may depend on optional configured resources.
- Existing review-deck rules for duplicate prevention and daily pacing apply to words added from the reading view.
- Some content may not have usable audio alignment, and text-first reading remains a complete fallback path for those cases.
