# Provider Fallback Checklist: Feasibility Spike Foundation

**Purpose**: Validate the quality of the optional provider fallback requirements so reviewers can assess whether the written requirements are complete, clear, bounded, and ready for implementation planning.
**Created**: 2026-04-18
**Feature**: [spec.md](../spec.md)

**Note**: This checklist tests the quality of the provider fallback requirements, not whether any provider integration works.

## Requirement Completeness

- [ ] CHK001 Are all provider-assisted feature areas explicitly enumerated, including the distinction between inline language help and optional audio generation? [Completeness, Spec §User Story 2, Spec §FR-004, Contract §Policy Object]
- [ ] CHK002 Are the learner trigger conditions for invoking provider assistance fully defined rather than left to implementer judgment? [Gap, Spec §Independent Test, Spec §FR-004]
- [ ] CHK003 Are the required fields of the fallback specification complete across policy, request, and result shapes, or do any required requirement elements exist only in the contract? [Completeness, Spec §FR-004, Contract §Policy Object, Contract §Prompt/Request Object, Contract §Result Object]
- [ ] CHK004 Does the spec fully define the no-key path for reading, review, and audio-adjacent flows, rather than stating only that degradation must be graceful? [Completeness, Spec §User Story 2, Spec §FR-005, Spec §FR-006]
- [ ] CHK005 Are usage-cap requirements complete enough to cover both call-count limits and budget ceilings for a standard study session? [Completeness, Spec §FR-004, Spec §SC-003, Data Model §Provider Fallback Policy]

## Requirement Clarity

- [ ] CHK006 Is "qualifies for provider assistance" defined with unambiguous rules so reviewers can determine when fallback is allowed versus denied? [Clarity, Spec §Acceptance Scenarios, Spec §FR-004]
- [ ] CHK007 Are the latency expectations clear for each assisted action, including the distinction between 3-second inline help and 10-second audio generation? [Clarity, Spec §SC-002, Data Model §Provider Fallback Policy, Contract §Policy Object]
- [ ] CHK008 Is "graceful non-blocking outcome" specific enough to describe what the learner sees, what progress is preserved, and what local-only alternative remains available? [Ambiguity, Spec §Acceptance Scenarios, Spec §FR-005, Contract §Result Object]
- [ ] CHK009 Is the term "usage guardrails" decomposed into measurable policy dimensions such as max calls, estimated cost ceiling, and denial behavior? [Clarity, Spec §Acceptance Scenarios, Spec §SC-003, Contract §Policy Object]
- [ ] CHK010 Are the differences between `denied`, `degraded`, and local-only `none` provider modes clearly defined in requirement language rather than implied by the contract alone? [Clarity, Contract §Policy Object, Contract §Result Object]

## Requirement Consistency

- [ ] CHK011 Do the fallback requirements remain consistent with the constitution-level local-first constraint that network usage is strictly additive and disabled until credentials are configured? [Consistency, Spec §Local Data & Privacy, Spec §FR-005, Research §Standardize on provider-agnostic adapters for LLM and TTS features]
- [ ] CHK012 Are the provider fallback requirements consistent between the spec, data model, and contract regarding required policy fields and no-key behavior? [Consistency, Spec §FR-004, Spec §FR-005, Data Model §Provider Fallback Policy, Contract §Policy Object]
- [ ] CHK013 Do the audio fallback requirements stay consistent with the broader reading-and-review continuity rules so audio remains additive rather than required? [Consistency, Spec §Reading, Listening, and TTS, Spec §FR-006]
- [ ] CHK014 Are the privacy requirements for learner-approved text consistent between the feature narrative and the request contract payload rules? [Consistency, Spec §Local Data & Privacy, Contract §Prompt/Request Object]

## Acceptance Criteria Quality

- [ ] CHK015 Can the latency target requirement be objectively evaluated for every provider-assisted action based on the current wording, or are action-specific thresholds missing? [Measurability, Spec §SC-002]
- [ ] CHK016 Is the session budget requirement measurable without additional definitions for what counts as a standard 30-minute study session? [Ambiguity, Spec §SC-003, Artifact Contract §LLM Fallback Spec Artifact]
- [ ] CHK017 Are cost-model requirements measurable enough to compare provider options, or do they rely on unspecified assumptions about token volume, audio length, or retry behavior? [Measurability, Gap, Spec §FR-004, Spec §SC-003]

## Scenario Coverage

- [ ] CHK018 Are alternate scenarios defined for policies that allow one provider-assisted feature area but deny another within the same session? [Coverage, Gap, Spec §User Story 2, Contract §Policy Object]
- [ ] CHK019 Are exception scenarios fully specified for timeout, cap exhaustion, provider error, policy denial, and missing credentials across both language and audio paths? [Coverage, Spec §Acceptance Scenarios, Spec §FR-005, Spec §FR-006, Contract §Result Object]
- [ ] CHK020 Are recovery-path requirements defined for resuming the learner flow after a provider-assisted attempt degrades mid-session without losing context or progress? [Recovery, Gap, Spec §Edge Cases, Spec §FR-005]
- [ ] CHK021 Are requirements specified for switching between providers or provider types without changing the learner-visible fallback behavior? [Coverage, Gap, Research §Standardize on provider-agnostic adapters for LLM and TTS features]

## Edge Case Coverage

- [ ] CHK022 Are requirements defined for audio-unavailable states when text assistance remains available, and vice versa? [Edge Case, Spec §Edge Cases, Spec §Reading, Listening, and TTS]
- [ ] CHK023 Does the requirements set define what happens when usage or cost caps are exceeded after a request has already started rather than before execution begins? [Edge Case, Gap, Spec §Edge Cases, Contract §Result Object]
- [ ] CHK024 Are requirements explicit about how learner-approved text boundaries apply to generated sentences, subtitles, and other approved source types before off-device transmission? [Edge Case, Spec §Local Data & Privacy, Contract §Prompt/Request Object]

## Non-Functional Requirements

- [ ] CHK025 Are privacy boundaries explicit enough to verify what text may leave the device, under which conditions, and with what provenance guarantees? [Non-Functional, Spec §Local Data & Privacy, Spec §FR-009, Contract §Prompt/Request Object]
- [ ] CHK026 Are vendor-independence requirements sufficiently specified to prevent accidental lock-in during later implementation planning? [Non-Functional, Research §Standardize on provider-agnostic adapters for LLM and TTS features]
- [ ] CHK027 Are offline-after-generation requirements clearly specified for the fallback artifact itself so planning can consume it without network access? [Non-Functional, Artifact Contract §LLM Fallback Spec Artifact, Artifact Contract §Rules]

## Dependencies & Assumptions

- [ ] CHK028 Are the assumptions about available providers, pricing stability, and latency predictability documented rather than implicitly accepted? [Assumption, Spec §Assumptions, Research §Standardize on provider-agnostic adapters for LLM and TTS features]
- [ ] CHK029 Is the dependency between fallback policy design and later bounded-review planning made explicit enough to avoid hidden work-creation risks? [Dependency, Spec §FR-010, Spec §Review Load & Recovery]

## Ambiguities & Conflicts

- [ ] CHK030 Is there any unresolved conflict between preserving a no-key fully usable product and defining provider-assisted features for the same learner actions? [Conflict, Spec §User Story 2, Spec §FR-005]
- [ ] CHK031 Does the requirements set clearly separate fallback policy rules from provider-specific implementation details that should remain outside the spec? [Ambiguity, Spec §FR-004, Research §Standardize on provider-agnostic adapters for LLM and TTS features]
- [ ] CHK032 If audio and language assistance share one session budget, is that relationship explicitly defined anywhere in the requirements set? [Gap, Spec §SC-003, Data Model §Provider Fallback Policy]