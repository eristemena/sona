# Feature Specification: Home, Library, and Settings Hub

**Feature Branch**: `[006-home-library-settings]`  
**Created**: 2026-04-24  
**Status**: Draft  
**Input**: User description: "When a learner opens Sona, they should immediately see how they're doing — how many words are due for review today, what they've been studying recently, and how active they've been this week. From the home screen they should be able to jump straight into reviewing or continue where they left off reading. They should also have a place to manage all their imported and generated content, search through it, and filter by type. The app settings should let them configure their API key, choose a TTS voice, and set their daily study goal."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start From Today’s Priorities (Priority: P1)

When a learner opens Sona, they can immediately see the state of today’s study workload, recent learning activity, and the fastest next action so they do not need to navigate around the app to decide what to do next.

**Why this priority**: The home screen is the daily entry point. If it does not clearly surface review due counts, recent study context, and resume actions, the rest of the product becomes harder to use consistently.

**Independent Test**: Can be fully tested by opening the app with existing local study data and confirming the learner can see today’s review count, recent study activity, weekly activity summary, and launch either review or resume reading directly from the first screen.

**Acceptance Scenarios**:

1. **Given** the learner has review items due today, **When** they open Sona, **Then** the home screen shows the due count prominently and offers a direct action to begin review.
2. **Given** the learner has an in-progress reading session, **When** they open Sona, **Then** the home screen offers a direct action to continue from the last-read content.
3. **Given** the learner has recent study activity from the last seven days, **When** they open Sona, **Then** the home screen summarizes recent work and weekly activity without requiring navigation to another screen.

---

### User Story 2 - Manage Study Content Library (Priority: P2)

The learner can browse, search, and filter all imported and generated content from one place so they can quickly find study material and understand what is available in their library.

**Why this priority**: The library is the control surface for learner-owned content. It keeps imported and generated material visible, searchable, and manageable instead of buried behind individual study flows.

**Independent Test**: Can be fully tested by populating the local library with mixed content types, then verifying the learner can view the collection, search by text, and filter by content type to narrow the list.

**Acceptance Scenarios**:

1. **Given** the learner has multiple imported and generated items in their library, **When** they open the library screen, **Then** they can see all saved content with enough metadata to identify each item.
2. **Given** the learner enters a search term, **When** the term matches saved content, **Then** the library updates to show matching items only.
3. **Given** the learner applies a type filter, **When** the library contains matching and non-matching items, **Then** only items of the selected type are shown until the filter is cleared.

---

### User Story 3 - Personalize Study Settings (Priority: P3)

The learner can configure the settings that affect optional AI-assisted features, pronunciation output, and daily pacing so the app matches their study setup and target workload.

**Why this priority**: Settings are necessary to make optional provider-backed features usable and to keep the daily study loop aligned with the learner’s preferences, but they are less urgent than the core start and library flows.

**Independent Test**: Can be fully tested by opening settings, changing the API key, TTS voice, and daily study goal, then closing and reopening the app to confirm those preferences remain available for later sessions.

**Acceptance Scenarios**:

1. **Given** the learner wants to enable optional provider-backed features, **When** they enter or update an API key in settings, **Then** the key is saved locally and remains editable later.
2. **Given** one or more TTS voices are available, **When** the learner selects a preferred voice, **Then** the selection is saved and used as the default voice preference for future listening flows.
3. **Given** the learner changes their daily study goal, **When** they save the new value, **Then** the updated goal is reflected in the app’s progress and pacing surfaces.

---

### Edge Cases

- How does the home screen behave when the learner has no due reviews, no recent reading session, or no activity yet?
- How does the library behave when search and filters return no matches?
- How does settings behavior stay usable when no TTS voices are available or optional provider credentials have not been configured?
- How does the home screen avoid overstating progress if the learner has skipped days and accumulated a backlog?

## Local-First & Learning Load Impact *(mandatory)*

### Local Data & Privacy

- The feature reads and updates locally stored learner progress, recent activity summaries, content-library records, resume position, and study preferences.
- The feature stores API key, preferred TTS voice, and daily study goal on the learner’s device.
- Optional provider-backed capabilities may use the network later when the learner explicitly invokes them, but the dashboard, library browsing, filtering, resume actions, and settings management remain usable without network access.

### Source Material & Provenance

- The library presents learner-imported content and learner-approved generated content already stored in Sona.
- Library entries must remain traceable to their source type and origin so the learner can distinguish imported material from generated material.
- This feature does not create opaque study material; it exposes existing learner-owned content and preserves the ability to inspect and manage it.

### Review Load & Recovery

- The home screen surfaces existing due work and recent study activity but does not itself create new review items.
- Daily study goal changes affect pacing targets and progress display only; they must not silently generate extra review work.
- When backlog exists, the home screen should present today’s due work clearly without implying that the learner must clear the entire backlog in one session.

### Reading, Listening, and TTS

- The home screen links back into review and reading so the learner can continue the connected study loop from a single entry point.
- Settings define the learner’s default TTS preference for listening-supported flows.
- If TTS voices or provider-backed capabilities are unavailable, the settings screen must still allow the learner to keep or change non-audio preferences, and the rest of the feature remains usable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a home screen that summarizes today’s due review count, recently studied material, and activity from the current week when local study data exists.
- **FR-002**: System MUST allow the learner to start a review session directly from the home screen when review work is available.
- **FR-003**: System MUST allow the learner to continue the most recent in-progress reading session directly from the home screen when resumable reading progress exists.
- **FR-004**: System MUST present a content library showing all learner-imported and learner-approved generated content saved in the app.
- **FR-005**: System MUST allow the learner to search the content library by text-based metadata and narrow the library by content type.
- **FR-006**: System MUST preserve clear source-type labeling for library items so imported and generated content remain distinguishable.
- **FR-007**: System MUST provide a settings screen where the learner can create, update, and clear a locally stored API key used for optional provider-backed features.
- **FR-008**: System MUST provide a settings screen where the learner can choose a preferred TTS voice when voice options are available and keep the preference editable later.
- **FR-009**: System MUST allow the learner to set and update a daily study goal that the app uses for goal and progress displays.
- **FR-010**: System MUST persist home-screen inputs, library state needed for navigation, and learner settings locally so they remain available across app restarts.
- **FR-011**: System MUST remain usable offline for dashboard viewing, library browsing, searching, filtering, and settings management.
- **FR-012**: System MUST show appropriate empty states when no review items, resumable reading session, library results, or voice options are available.

### Key Entities *(include if feature involves data)*

- **Home Study Summary**: A learner-facing summary of due review work, recent study activity, weekly activity, and available resume actions.
- **Library Item**: A saved piece of study content with title or identifying label, content type, provenance, and status needed for browsing and resuming study.
- **Study Preferences**: Learner-owned settings including optional API key, preferred TTS voice, and daily study goal.
- **Resume Context**: The saved reference to the learner’s most recent reading session and location for returning to in-progress content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In manual acceptance testing with existing local study data, learners can identify today’s due review count and their next available study action within 10 seconds of opening the app.
- **SC-002**: In manual acceptance testing, learners can start review or resume reading from the home screen in no more than 2 interactions.
- **SC-003**: In manual acceptance testing with a mixed library, learners can locate a known content item using search or type filters within 30 seconds.
- **SC-004**: In manual acceptance testing, changes to API key, TTS voice preference, and daily study goal remain available after closing and reopening the app.
- **SC-005**: The feature remains fully usable for dashboard viewing, library management, and settings updates when the device has no network connection.

## Assumptions

- The primary learner is a self-directed Korean learner using Sona on a desktop device.
- Review scheduling, reading resume data, and library records already exist or will exist as local product data that this feature surfaces rather than redefines.
- Optional provider-backed features remain non-essential to the core study loop; missing credentials must not block offline use of home, library, or settings.
- Generated content shown in the library has already been learner-approved before it appears alongside imported content.