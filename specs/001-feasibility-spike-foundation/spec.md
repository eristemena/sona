# Feature Specification: Feasibility Spike Foundation

**Feature Branch**: `001-feasibility-spike-foundation`  
**Created**: 2026-04-18  
**Status**: Draft  
**Input**: User description: "Electron 33 + Next.js 15 static export on the frontend; better-sqlite3 for local data; OpenAI or Anthropic API for LLM features; OpenAI TTS or Google Cloud TTS for audio. Tokenizer track (local JS segmenter vs. LLM-first) is confirmed in this phase by a feasibility spike. FSRS via ts-fsrs for spaced repetition. All features degrade gracefully when no API key is configured. The three pre-spike tasks are: (1) tokenizer accuracy spike on a stratified Korean corpus, (2) LLM-first fallback spec with prompt, latency targets, cost model, and usage cap design, (3) SQLite concurrency benchmark validating that concurrent annotation refresh and SRS harvest complete within acceptable latency on 2019-era hardware."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confirm the Tokenization Track (Priority: P1)

As the product owner, I need a documented decision on whether local tokenization is accurate enough for Korean study workflows so the reading, lookup, and vocabulary pipeline starts from a reliable segmentation approach.

**Why this priority**: Tokenization quality determines whether every later content-derivation step can be trusted. Without this decision, planning the core study flow is premature.

**Independent Test**: Run the tokenizer spike against a stratified Korean corpus, review the measured results by corpus segment, and confirm that the outcome produces a clear recommended track with known failure patterns.

**Acceptance Scenarios**:

1. **Given** a representative Korean corpus spanning multiple content types, **When** the spike evaluates local tokenization quality, **Then** the results are recorded by content stratum with a clear recommendation to proceed, revise, or defer the local-first track.
2. **Given** tokenization errors that would distort learner-facing lookup or card generation, **When** the spike report is reviewed, **Then** those failure cases are explicitly captured with their learner impact and proposed fallback behavior.

---

### User Story 2 - Define the Optional LLM Fallback (Priority: P2)

As a learner using a local-first app, I need optional online language-assistance behavior to be well-bounded so I can keep studying without an API key and understand when the system may use paid provider features.

**Why this priority**: The product promise requires graceful degradation without online credentials, but planning also needs a safe fallback path when local processing is insufficient.

**Independent Test**: Review the written fallback specification and verify it includes the learner trigger conditions, prompt contract, latency target, cost model, and usage caps, plus a complete no-key behavior path.

**Acceptance Scenarios**:

1. **Given** no API key is configured, **When** the learner uses reading, review, or audio-related flows, **Then** the product remains usable with clear local-only behavior and no blocked core study action.
2. **Given** an online fallback is available, **When** a learner action qualifies for provider assistance, **Then** the fallback specification defines what input is sent, what response is expected, how long the learner should wait, and what usage guardrails apply.
3. **Given** a provider response is slow, unavailable, or exceeds the allowed usage budget, **When** fallback would otherwise run, **Then** the learner receives a graceful non-blocking outcome and the action returns to the local-only path.

---

### User Story 3 - Validate Local Data Concurrency (Priority: P3)

As the maintainer, I need evidence that local study workloads can run concurrently on older consumer hardware so background refresh work does not make reading or spaced repetition feel fragile.

**Why this priority**: Local-first credibility depends on proving that concurrent annotation refresh and review harvesting stay responsive on the baseline device class the app is expected to support.

**Independent Test**: Execute the concurrency benchmark on 2019-era hardware, capture completion times and responsiveness observations, and verify that the report either passes the target thresholds or names the blocking risks for planning.

**Acceptance Scenarios**:

1. **Given** background annotation refresh and review harvesting are triggered at the same time, **When** the benchmark runs on baseline hardware, **Then** both jobs finish within the documented target window without causing prolonged learner-visible lockups.
2. **Given** concurrent work causes contention, **When** the benchmark report is reviewed, **Then** the specific operations, latency spikes, and mitigations needed for planning are clearly identified.

### Edge Cases

- The stratified Korean corpus may overrepresent one content type and hide failure modes in subtitles, conversational text, or literary prose.
- A learner may never configure an API key, so every core reading, review, and audio-adjacent flow must have a local-only behavior that is still usable.
- Provider assistance may exceed cost or latency guardrails mid-session, requiring a handoff back to the local-only path without losing learner progress.
- Background refresh and spaced-repetition harvesting may overlap with active study sessions on older hardware, requiring clear thresholds for what counts as unacceptable blocking.
- Audio generation may be unavailable even when text study is available, so the feature must preserve reading and review continuity while marking audio as unavailable or deferred.

## Local-First & Learning Load Impact *(mandatory)*

### Local Data & Privacy

- The feature creates local feasibility artifacts, including tokenization evaluation results, concurrency benchmark results, provider fallback rules, latency targets, cost assumptions, and usage-cap defaults.
- The feature may use the network only for optional provider-assisted language or audio behavior. These paths remain strictly additive and disabled until a learner configures credentials.
- Core study behaviors remain available without network access by falling back to local tokenization, local persistence, and text-first study flows.

### Source Material & Provenance

- Learner-provided or learner-approved Korean source material is the input to the tokenization spike and any derived vocabulary or annotation experiments.
- Every evaluated sentence or harvested study candidate must remain traceable to its original source item, source segment, and evaluation context so later planning preserves inspectability.
- Any provider-assisted fallback specification must name what learner-approved text can be sent off-device and under what explicit conditions.

### Review Load & Recovery

- This feature does not directly add learner-facing review content by default; it defines the guardrails that later content-derivation work must follow.
- The fallback specification must include a usage-cap design that prevents provider-assisted derivation from generating unbounded new work in a single session.
- The concurrency and tokenization outputs must inform later review pacing rules so inaccurate segmentation or delayed harvesting cannot create a sudden catch-up burden.

### Reading, Listening, and TTS

- The feature establishes how text analysis, optional audio generation, and spaced-repetition harvesting will coexist within one learning loop.
- Audio is treated as additive to reading and review. If no provider is configured, if audio generation fails, or if audio would exceed the allowed budget, the learner still receives text study and review behavior with an explicit audio-unavailable state.
- The fallback design must preserve a clear path from a reading segment to its review candidates even when pronunciation or audio support is absent.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST produce a written feasibility report that compares the available tokenization tracks against a stratified Korean corpus and ends with a recommended path for the first implementation phase.
- **FR-002**: The system MUST record tokenization results by source-content stratum so stakeholders can see where each track succeeds, fails, or requires fallback handling.
- **FR-003**: The system MUST describe the learner-visible impact of tokenization failures on reading lookup, vocabulary harvesting, and review preparation.
- **FR-004**: The system MUST define an optional provider-assisted fallback specification for language-processing tasks, including trigger conditions, expected inputs and outputs, prompt guidance, latency targets, cost model, and per-session usage-cap behavior.
- **FR-005**: The system MUST define graceful-degradation behavior for every provider-assisted feature so that reading, local study data, and spaced-repetition workflows remain usable when no API key is configured or when provider calls are unavailable.
- **FR-006**: The system MUST define how optional audio generation behaves when provider credentials are missing, invalid, rate-limited, or disabled by learner choice.
- **FR-007**: The system MUST benchmark concurrent annotation refresh and spaced-repetition harvesting on baseline 2019-era hardware and document whether learner-visible responsiveness stays within the accepted threshold.
- **FR-008**: The system MUST capture benchmark findings in a form that planning can use, including workload assumptions, pass or fail status, bottleneck observations, and required mitigations if thresholds are missed.
- **FR-009**: The system MUST preserve local provenance for all evaluated source material, derived study candidates, and benchmark inputs used in the feasibility phase.
- **FR-010**: The system MUST identify the bounded-review implications of the chosen tokenization and fallback tracks so later implementation planning can cap new study work and recover safely from skipped days.
- **FR-011**: The system MUST store all feasibility outputs locally and make them available to the planning workflow without requiring cloud storage, user accounts, or telemetry.

### Key Entities *(include if feature involves data)*

- **Corpus Segment**: A learner-approved unit of Korean source material used in the feasibility spike, with attributes for source type, content stratum, text boundaries, and provenance.
- **Tokenization Evaluation Result**: The recorded outcome for one tokenization track against one corpus segment or stratum, including quality findings, failure patterns, and recommended disposition.
- **Provider Fallback Policy**: The rules that govern when provider assistance may run, what content is eligible, what latency and cost limits apply, and how the learner is protected when the policy denies or aborts the request.
- **Concurrency Benchmark Run**: A recorded test execution describing the baseline device class, overlapping workloads, completion times, responsiveness observations, and pass or fail conclusion.
- **Study Candidate Provenance Record**: The linkage between a source segment, its derived annotations or review candidates, and the decision path that produced them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The feasibility phase produces a tokenization decision report covering 100% of the defined corpus strata and identifying the recommended first-phase track with no unresolved gaps in learner-visible failure handling.
- **SC-002**: The optional provider fallback specification defines latency targets for each assisted action and keeps the maximum allowed wait time at or below 3 seconds for inline study assistance and 10 seconds for optional audio generation before the flow degrades gracefully.
- **SC-003**: The optional provider fallback specification defines a session-level usage cap and cost model such that a learner can complete a standard 30-minute study session without exceeding the documented budget ceiling.
- **SC-004**: In a no-key configuration, 100% of primary reading and spaced-repetition study scenarios in the spec remain completable without blocked progression.
- **SC-005**: On baseline 2019-era hardware, concurrent annotation refresh and spaced-repetition harvesting complete within 30 seconds total while any learner-visible blocking period stays under 1 second per interaction.

## Assumptions

- The primary user is a self-directed Korean learner on a desktop or laptop device, and this phase exists to de-risk the first local-first product build before feature implementation begins.
- Accounts, cloud sync, telemetry, and mandatory online services remain out of scope for this phase.
- The stratified Korean corpus is assembled from learner-approved source material categories relevant to the intended study experience, such as articles, subtitles, and sentence-oriented study text.
- Baseline hardware means a 2019-era consumer laptop or desktop that reflects the minimum acceptable study experience for the first release target.
- Audio support is valuable but non-essential for completing a study session; text study and review continuity take precedence whenever audio is unavailable.
