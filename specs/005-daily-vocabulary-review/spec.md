# Feature Specification: Daily Vocabulary Review

**Feature Branch**: `[005-daily-vocabulary-review]`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "Sona needs a daily vocabulary review system. Words the learner has added to their deck during reading sessions should appear as flashcards. Each card shows the Korean word on the front and the meaning and grammar details on the back. The learner rates how well they remembered it, and the app decides when to show it again — sooner if they struggled, later if they knew it well. The system should know which words the learner already knows so it doesn't prompt them to add common vocabulary to their deck unnecessarily."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Due Vocabulary (Priority: P1)

As a learner, I want a daily review session that shows the vocabulary I previously saved from reading so I can strengthen recall without rebuilding my study list each day.

**Why this priority**: This is the core study loop. Without a dependable daily review queue, saved vocabulary does not turn into sustained retention practice.

**Independent Test**: Can be fully tested by opening a day with due vocabulary, reviewing the cards one by one, rating recall, and confirming the session updates what is due next.

**Acceptance Scenarios**:

1. **Given** a learner has vocabulary cards due for review, **When** they start the daily review session, **Then** the app shows those due cards as flashcards instead of requiring the learner to search for them manually.
2. **Given** a review card is shown, **When** the learner flips or reveals it, **Then** the front shows the Korean word and the back shows the saved meaning and grammar details for that word.
3. **Given** the learner rates a reviewed card as difficult, **When** the rating is submitted, **Then** that card is scheduled to return sooner than a card rated as easy.

---

### User Story 2 - Carry Reading Vocabulary Into Review (Priority: P2)

As a learner, I want words I add during reading sessions to become review cards with source context so the review system reflects what I actually encountered while studying.

**Why this priority**: Sona’s value depends on learner-owned content flowing directly into review. This keeps the review deck tied to real reading experience instead of isolated word lists.

**Independent Test**: Can be fully tested by adding a word from a reading session, confirming it appears in the review deck with its saved details, and verifying the learner can still inspect where it came from.

**Acceptance Scenarios**:

1. **Given** a learner adds a word from a reading session to their deck, **When** the next review cycle is prepared, **Then** that word appears as a flashcard with the saved Korean form, meaning, grammar details, and source reading context.
2. **Given** a learner opens a saved review card, **When** they inspect its details, **Then** they can trace the card back to the reading material it came from.

---

### User Story 3 - Avoid Unnecessary Vocabulary Prompts (Priority: P3)

As a learner, I want the app to recognize words I already know so I am not repeatedly prompted to add common or already-mastered vocabulary to my deck.

**Why this priority**: Unnecessary add prompts create noise, weaken trust in the deck-building flow, and increase review load without adding learning value.

**Independent Test**: Can be fully tested by marking or establishing a word as already known, revisiting reading content containing that word, and confirming the app does not present it as a new deck candidate.

**Acceptance Scenarios**:

1. **Given** a word is already in the learner’s deck or known-word list, **When** the learner encounters it during reading, **Then** the app does not prompt the learner to add it again as new vocabulary.
2. **Given** a learner decides a word is already familiar enough, **When** they mark it as known, **Then** future reading sessions treat that word as already covered unless the learner later changes that status.

### Edge Cases

- A learner adds the same Korean word from multiple reading sessions with slightly different meanings or grammar notes.
- A saved card has incomplete grammar details because the original reading annotation was partial or edited later.
- The learner skips several study days and returns to a large backlog of due cards.
- A word is marked as known after a card already exists in review, and the system must avoid duplicate prompts without losing past study history.
- A source reading item is edited or removed after cards were created from it.

## Local-First & Learning Load Impact *(mandatory)*

### Local Data & Privacy

- The feature creates and updates local vocabulary cards, review history, due status, known-word status, and source references for words captured from reading sessions.
- Core review works entirely from locally stored card content and learner progress.
- Any future network use for optional enrichment, such as refreshing card details or pronunciation help, remains optional and cannot block daily review of already saved cards.

### Source Material & Provenance

- The source material is learner-saved reading content and the words the learner explicitly chooses to capture from that content.
- Each derived flashcard keeps a traceable link back to its source reading context so the learner can inspect where the word came from.
- Learners can review and adjust saved meanings, grammar details, and known-word status so derived study material remains inspectable and correctable.

### Review Load & Recovery

- The feature creates scheduled vocabulary review work only for words the learner has added to the deck or intentionally kept in review.
- Words recognized as already known do not create new review work and should not keep reappearing as add suggestions.
- If the learner misses days, the system carries overdue vocabulary forward in a manageable way instead of forcing every missed review into one overwhelming session.

### Reading, Listening, and TTS

- This feature connects reading and review by turning learner-selected reading vocabulary into flashcards while preserving the original study context.
- Review cards remain usable even if audio or pronunciation support is unavailable.
- If pronunciation or TTS support exists elsewhere in the product, it may enrich card study, but the absence of audio cannot prevent vocabulary review.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a vocabulary review card when the learner adds a word from a reading session to their deck.
- **FR-002**: System MUST present each review card as a flashcard with the Korean word on the front and the saved meaning and grammar details on the back.
- **FR-003**: System MUST include newly added deck words in the learner’s daily review flow once they become due.
- **FR-004**: System MUST let the learner rate how well they remembered each reviewed card after revealing the answer.
- **FR-005**: System MUST schedule the next review time sooner after weaker recall ratings and later after stronger recall ratings.
- **FR-006**: System MUST persist vocabulary cards, learner ratings, due status, and review history locally so daily review remains available offline.
- **FR-007**: System MUST preserve source provenance for each card so the learner can inspect the reading context from which the card was created.
- **FR-008**: System MUST let the learner mark a word or card as already known and use that status to suppress unnecessary add-to-deck prompts during reading.
- **FR-009**: System MUST avoid prompting the learner to add a word that is already in the review deck or already recognized as known.
- **FR-010**: System MUST keep daily review load bounded by allowing unfinished due cards to carry forward without requiring the learner to clear the entire backlog in one session.
- **FR-011**: System MUST keep cards reviewable when saved meaning or grammar details are incomplete, while allowing the learner to inspect and correct those details.
- **FR-012**: System MUST keep the daily review workflow usable without network access, with optional enrichment remaining non-blocking.

### Key Entities *(include if feature involves data)*

- **Vocabulary Review Card**: A learner-owned flashcard created from a reading session word, containing the Korean prompt, meaning, grammar details, due status, and source reference.
- **Review Event**: A recorded learner response for a card review, including when the review happened, the recall rating given, and the resulting next due timing.
- **Known Word Record**: A learner-recognized status for a word that suppresses unnecessary add prompts and prevents avoidable new review work.
- **Source Vocabulary Capture**: The link between a saved word and the reading material, sentence, or passage where the learner first added it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Learners can start a daily vocabulary review session and submit a rating for the first due card within 30 seconds of opening review.
- **SC-002**: At least 95% of due vocabulary cards display a Korean front and a usable answer side from locally stored data even when the device is offline.
- **SC-003**: Learners can complete a 20-card daily review session in under 6 minutes when they do not open optional detail views.
- **SC-004**: At least 90% of words the learner has already marked as known or already saved in the deck are no longer shown as new add-to-deck prompts in later reading sessions.

## Assumptions

- The primary learner is a self-directed Korean learner using the desktop app for daily reading and review.
- Reading sessions already provide a way for the learner to add vocabulary to a deck, and this feature builds the repeat-review loop on top of that captured vocabulary.
- Known-word awareness may rely on learner-confirmed signals such as existing deck membership, explicit known-word marking, and prior study history rather than external vocabulary lists.
- Accounts, mandatory cloud sync, and network-required review behavior are out of scope for this feature.
- If optional audio or pronunciation support exists for cards, it is additive and not required for completing vocabulary review.
