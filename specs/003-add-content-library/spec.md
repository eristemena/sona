# Feature Specification: Add Content Library

**Feature Branch**: `003-add-content-library`  
**Created**: 2026-04-19  
**Status**: Draft  
**Input**: User description: "Sona needs three ways to add Korean study content: importing a subtitle file from a drama, pasting or scraping a Korean article, and generating practice sentences with AI at a chosen difficulty level and topic. All three should appear in a Content Library where the user can see what they've imported, how difficult it is, and what type of content it is. The user should be able to delete content from the library."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage the Content Library (Priority: P1)

As a learner, I want a single Content Library that shows all saved study content so I can quickly see what I have collected and remove items I no longer want.

**Why this priority**: The library is the shared destination for every content-ingestion path. If learners cannot review and manage their saved content, the three add flows do not produce durable value.

**Independent Test**: Open the Content Library with existing sample items and verify that each item shows its identifying label, difficulty, and content type, that search and type filters narrow the visible results correctly, then delete one item and confirm it is removed from the library.

**Acceptance Scenarios**:

1. **Given** the learner has one or more saved content items, **When** the learner opens the Content Library, **Then** each item is listed with a recognizable label, its difficulty level, and its content type.
2. **Given** the learner has saved content from multiple source types, **When** the learner views the Content Library, **Then** subtitle imports, article content, and generated practice sentences all appear in the same library.
3. **Given** the learner has multiple saved content items, **When** the learner applies a type filter or enters a search term, **Then** the Content Library narrows the visible items without changing the saved collection.
4. **Given** the learner chooses to delete a content item, **When** the learner confirms deletion, **Then** the item is removed from the Content Library and is no longer available in the local content collection.
5. **Given** the learner inspects a saved content item, **When** the learner opens its source details, **Then** the app shows enough provenance detail to distinguish the originating subtitle file, article source, or generation request.

---

### User Story 2 - Import Drama Subtitles (Priority: P2)

As a learner, I want to import a subtitle file from a Korean drama so I can turn dialogue I care about into study content inside Sona.

**Why this priority**: Subtitle import is a core learner-owned content path named directly in the product vision and supports text that already carries strong listening context.

**Independent Test**: Import a supported subtitle file, complete the import flow, and confirm that a new subtitle-based content item appears in the Content Library with the correct type and difficulty.

**Acceptance Scenarios**:

1. **Given** the learner has a supported subtitle file, **When** the learner imports it into Sona, **Then** the app saves it as a new subtitle-based content item in the Content Library.
2. **Given** a subtitle import completes successfully, **When** the learner views the new library item, **Then** the item is labeled as subtitle content and shows its assigned difficulty.
3. **Given** the learner imports a subtitle file that cannot be processed, **When** the import fails, **Then** the app explains that the import did not complete and does not add a partial item to the Content Library.

---

### User Story 3 - Add Korean Article Content (Priority: P3)

As a learner, I want to add Korean article content either by pasting text or by scraping an article I choose so I can study current reading material inside the same library.

**Why this priority**: Article content broadens the learner-owned pipeline beyond subtitle files and keeps Sona useful for reading practice even when no drama material is available.

**Independent Test**: Add one article by pasting Korean text and another by using a scrape flow, then confirm both items appear in the Content Library as article content with visible difficulty.

**Acceptance Scenarios**:

1. **Given** the learner has Korean article text, **When** the learner pastes it into the add-content flow and saves it, **Then** the app adds it to the Content Library as article content.
2. **Given** the learner provides an article source for scraping, **When** the scrape succeeds, **Then** the app saves the retrieved article as a new article item in the Content Library.
3. **Given** the scrape cannot be completed, **When** the learner attempts to add the article, **Then** the app keeps the rest of the library usable, explains the failure, and allows the learner to add article content by paste instead.

---

### User Story 4 - Generate Practice Sentences (Priority: P4)

As a learner, I want to generate Korean practice sentences for a chosen topic and difficulty so I can quickly create study content that matches my current level and interests.

**Why this priority**: Generated sentences are a useful supplement to learner-provided materials, but they remain secondary to importing and managing learner-approved source content.

**Independent Test**: Request generated practice sentences for a topic and difficulty, complete the generation flow, and confirm the resulting content appears in the Content Library with generated type and the validated difficulty while retaining the originally requested difficulty in its provenance details.

**Acceptance Scenarios**:

1. **Given** the learner provides a topic and difficulty for generated practice sentences, **When** the learner starts generation and it succeeds, **Then** the app adds the generated content to the Content Library.
2. **Given** generated practice content is saved, **When** the learner views it in the Content Library, **Then** the item is labeled as generated content and shows the validated difficulty, including any relabeling applied after validation.
3. **Given** sentence generation is unavailable or fails, **When** the learner attempts generation, **Then** the app explains that generated content could not be created and keeps imported subtitle and article content fully available.

### Edge Cases

- The learner imports a subtitle file with malformed structure, missing timing information, or no usable Korean text.
- The learner pastes article content that is empty, too short to be useful, or duplicates an item already in the library.
- The learner attempts to scrape an article while offline or from a source that cannot be retrieved.
- The learner requests generated practice sentences without providing a topic or difficulty.
- The learner deletes the last remaining item in the Content Library.
- The learner has items from all three source types and needs each one to remain distinguishable at a glance.

## Local-First & Learning Load Impact *(mandatory)*

### Local Data & Privacy

- The feature creates, stores, updates, and deletes learner content locally, including imported subtitle content, article content, generated practice sentences, difficulty metadata, content-type metadata, source details, and library membership.
- Subtitle import, pasted article entry, library browsing, and content deletion must work without network access.
- Article scraping and AI sentence generation may use network access only when the learner explicitly chooses those flows. The core library and offline add flows remain usable without them.
- The feature must not require an account, cloud-only persistence, or telemetry to add, browse, or delete locally saved content.

### Source Material & Provenance

- Learner-provided or learner-approved content enters this flow through subtitle files, pasted Korean article text, learner-initiated article scraping, and learner-requested generated sentence prompts.
- Every saved content item must preserve enough provenance for the learner to understand where it came from, including source type and source details appropriate to that type.
- Generated practice content must preserve the learner-selected topic and difficulty as part of its provenance.
- The learner must be able to inspect saved content and understand whether it came from a subtitle import, article flow, or generated-sentence flow.
- The learner must be able to inspect source details that identify the originating subtitle file path, article URL or paste session, or generation topic plus requested difficulty.

### Review Load & Recovery

- This feature adds content to the library but does not automatically schedule review items simply because content was imported or generated.
- Any future study or review creation from library content must happen through an explicit later action so learners are not surprised with new workload.
- Deleting content from the library must not create recovery backlog or hidden review obligations.

### Reading, Listening, and TTS

- Subtitle imports may carry listening context, but the library must remain usable even when no audio or pronunciation support is available.
- Article and generated sentence content must remain usable as text study material even if TTS or audio support is unavailable.
- The feature must preserve a path for future reading and listening features to trace back to the original saved content without requiring audio generation at import time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a Content Library that contains subtitle imports, article content, and generated practice sentence content in one local collection.
- **FR-002**: The system MUST allow the learner to import a subtitle file and save it as a library item.
- **FR-003**: The system MUST allow the learner to add Korean article content by pasting text directly into the app.
- **FR-004**: The system MUST allow the learner to add Korean article content through a learner-initiated scrape flow.
- **FR-005**: The system MUST allow the learner to request generated practice sentences by providing a topic and a difficulty level.
- **FR-006**: The system MUST save each successfully added content item locally so it remains available across later app sessions.
- **FR-007**: The system MUST display each library item with a recognizable label or title that lets the learner identify what was added.
- **FR-008**: The system MUST display the content type for each library item.
- **FR-009**: The system MUST display a non-null difficulty for each library item.
- **FR-010**: The system MUST make subtitle imports, article content, and generated practice sentences distinguishable from one another in the Content Library.
- **FR-011**: The system MUST preserve source provenance for every saved content item so the learner can understand how it entered the library.
- **FR-012**: The system MUST preserve the learner-selected topic and difficulty for generated practice sentence content.
- **FR-013**: The system MUST allow the learner to delete any content item from the Content Library.
- **FR-014**: The system MUST remove deleted content from the local library collection so it no longer appears in the Content Library.
- **FR-015**: The system MUST prevent failed add-content attempts from creating partial or misleading library items.
- **FR-016**: The system MUST keep library browsing and deletion usable without network connectivity.
- **FR-017**: The system MUST keep subtitle import and pasted-article entry usable without network connectivity.
- **FR-018**: The system MUST treat article scraping and AI sentence generation as learner-initiated optional flows rather than mandatory steps for using the library.
- **FR-019**: The system MUST communicate when scraping or AI sentence generation cannot be completed and must leave existing library content unchanged in that case.
- **FR-020**: The system MUST avoid creating new review tasks automatically when content is imported, pasted, scraped, or generated into the library.
- **FR-021**: The system MUST let the learner inspect source details for each saved content item, including the appropriate subtitle file path, article source, or generation request metadata.
- **FR-022**: The system MUST detect potential duplicate content before saving and warn the learner, while allowing the learner to continue saving it as a distinct item only after explicit confirmation.
- **FR-023**: The system MUST let the learner narrow library results by content type without changing the saved collection.
- **FR-024**: The system MUST let the learner search saved library content using title or source-derived text while preserving local-only operation.

### Key Entities *(include if feature involves data)*

- **Content Item**: A saved unit of Korean study content shown in the Content Library, including its identifying label, content type, difficulty, saved body, and deletion behavior.
- **Content Source Record**: The provenance details attached to a content item, describing whether it came from a subtitle import, pasted article, scraped article, or generated-sentence request, plus the learner-visible source details for that path and any requested-versus-validated difficulty metadata.
- **Generation Request**: The learner-specified topic and difficulty used to create generated practice sentence content and stored with the resulting content item.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Learners can add a supported subtitle file and see it appear in the Content Library in under 2 minutes during first-attempt usability testing.
- **SC-002**: Learners can add Korean article content by paste in under 3 minutes and can complete a successful scrape-based article add in under 3 minutes when the source is reachable.
- **SC-003**: In validation testing, 100% of saved library items display both content type and difficulty.
- **SC-004**: In mixed-library testing, learners can correctly identify whether an item came from subtitles, articles, or generated practice content for at least 90% of tested items.
- **SC-005**: In deletion testing, 100% of deleted items are removed from the Content Library and do not reappear on the next app launch.
- **SC-006**: With network access disabled, learners can still browse the Content Library, delete items, import subtitle files, and add article content by paste in 100% of tested offline scenarios.
- **SC-007**: Failed scrape or AI generation attempts do not create unintended library items in 100% of tested failure scenarios.

## Assumptions

- The primary user is a self-directed Korean learner using Sona on a desktop device.
- The library is a content-management surface in this feature phase and does not automatically create flashcards, reviews, or study sessions.
- Difficulty is required during each add-content flow so every saved item shows a non-null difficulty level in the library.
- Generated content may be relabeled after validation, but the originally requested difficulty remains inspectable in the item provenance.
- Learners may choose optional network-dependent flows for scraping and AI generation, but subtitle import, article paste, library browsing, and deletion remain core offline-capable behavior.
- Deleting a content item in this feature removes it from the local library collection only; any broader downstream study artifacts are out of scope until later features define them.