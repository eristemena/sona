# Tokenizer Checklist: Feasibility Spike Foundation

**Purpose**: Validate the quality of the tokenizer spike requirements so reviewers can assess whether the written spec is complete, clear, measurable, and ready for implementation planning.
**Created**: 2026-04-18
**Feature**: [spec.md](../spec.md)

**Note**: This checklist tests the quality of the requirements for the tokenizer spike, not whether the spike implementation works.

## Requirement Completeness

- [ ] CHK001 Are the exact corpus strata explicitly enumerated rather than left to interpretation? [Gap, Spec §User Story 1]
- [ ] CHK002 Are the tokenization tracks to be compared fully listed and named consistently across the spec and research artifacts? [Completeness, Spec §User Story 1, Spec §FR-001, Research §Treat local tokenization as the preferred track]
- [ ] CHK003 Are the required output sections of the tokenization decision report defined beyond "recommended path," including metrics, failure patterns, and mitigation notes? [Completeness, Spec §FR-001]
- [ ] CHK004 Are the requirements explicit about which learner-facing flows must be evaluated for tokenization impact beyond reading lookup, vocabulary harvesting, and review preparation? [Gap, Spec §FR-003]
- [ ] CHK005 Does the spec define whether provenance requirements apply to raw corpus fixtures, normalized text, and any intermediate tokenization artifacts separately? [Completeness, Spec §Local-First & Learning Load Impact, Spec §FR-009]

## Requirement Clarity

- [ ] CHK006 Is "stratified Korean corpus" defined with specific sampling rules or acceptance criteria so reviewers can determine whether corpus composition is sufficient? [Clarity, Spec §User Story 1, Spec §Edge Cases]
- [ ] CHK007 Is "accurate enough for Korean study workflows" quantified with explicit quality thresholds or decision rules for the tokenizer track recommendation? [Ambiguity, Spec §User Story 1, Spec §SC-001]
- [ ] CHK008 Are "known failure patterns" defined with a required taxonomy or minimum classification scheme so the spike output is comparable across strata? [Clarity, Spec §Independent Test, Spec §FR-002]
- [ ] CHK009 Is "learner-visible impact" described with enough specificity to distinguish severity levels and downstream consequences for lookup, annotation, and card generation? [Clarity, Spec §FR-003]
- [ ] CHK010 Are the recommendation states `proceed`, `revise`, `defer`, and `fallback-only` defined with unambiguous entry criteria? [Clarity, Spec §User Story 1, Data Model §Tokenization Evaluation Result]

## Requirement Consistency

- [ ] CHK011 Do the tokenizer requirements stay consistent between the spec's success criterion of full stratum coverage and the data model's segment-level evaluation structure? [Consistency, Spec §SC-001, Data Model §Corpus Segment, Data Model §Tokenization Evaluation Result]
- [ ] CHK012 Are the tokenizer decision requirements consistent with the research decision that local tokenization is preferred while provider assistance remains fallback-only? [Consistency, Spec §FR-001, Research §Treat local tokenization as the preferred track]
- [ ] CHK013 Do the bounded-review implications in the tokenizer requirements align with the broader no-backlog intent of the feasibility phase? [Consistency, Spec §Review Load & Recovery, Spec §FR-010]
- [ ] CHK014 Are the source-material and provenance requirements consistent between the spec entities and the data model fields for source type, stratum, and derivation linkage? [Consistency, Spec §Key Entities, Data Model §Corpus Segment, Data Model §Study Candidate Provenance Record]

## Acceptance Criteria Quality

- [ ] CHK015 Can the tokenization recommendation be objectively approved or rejected based on the current success criteria, or is additional pass/fail logic missing? [Measurability, Spec §SC-001]
- [ ] CHK016 Are the quality metrics for tokenizer evaluation named and measurable, rather than implied through generic "accuracy" language alone? [Gap, Spec §FR-001, Data Model §Tokenization Evaluation Result]
- [ ] CHK017 Is the requirement for 100% corpus-stratum coverage measurable if strata are not predeclared in the requirements? [Measurability, Conflict, Spec §SC-001]

## Scenario Coverage

- [ ] CHK018 Are alternate scenarios defined for cases where one tokenizer performs well on some strata and poorly on others, rather than producing a single global recommendation? [Coverage, Gap, Spec §User Story 1]
- [ ] CHK019 Are exception requirements defined for tokenization outputs that are unusable for one downstream flow but acceptable for another? [Coverage, Gap, Spec §FR-003]
- [ ] CHK020 Are recovery-path requirements specified for how planning proceeds if no tokenizer track meets the acceptance threshold? [Recovery, Gap, Spec §User Story 1, Spec §FR-001]

## Edge Case Coverage

- [ ] CHK021 Are the edge cases sufficiently specific about subtitle timing artifacts, conversational fragments, and literary prose so reviewers know which failure modes must be represented? [Edge Case, Spec §Edge Cases]
- [ ] CHK022 Does the spec define how duplicate, malformed, or partially normalized corpus segments affect tokenizer evaluation validity? [Edge Case, Gap, Spec §Edge Cases]
- [ ] CHK023 Are requirements defined for how mixed-script text, punctuation-heavy input, or learner-generated sentences should be treated in the tokenizer spike? [Edge Case, Gap, Spec §Local-First & Learning Load Impact]

## Non-Functional Requirements

- [ ] CHK024 Are the tokenizer spike requirements explicit about acceptable local execution time or resource usage, or is performance intentionally excluded from this domain? [Non-Functional, Gap]
- [ ] CHK025 Are privacy and off-device processing boundaries clear enough to verify that tokenizer evaluation remains local unless an explicitly separate fallback path is triggered? [Non-Functional, Spec §Local Data & Privacy, Research §Treat local tokenization as the preferred track]

## Dependencies & Assumptions

- [ ] CHK026 Are the assumptions about baseline corpus representativeness validated by requirements, or do they rely on reviewer judgment alone? [Assumption, Spec §Assumptions]
- [ ] CHK027 Is the dependency between tokenizer outputs and later FSRS harvesting requirements explicit enough to support planning without hidden coupling? [Dependency, Spec §FR-010]

## Ambiguities & Conflicts

- [ ] CHK028 Is there any conflict between requiring a recommended first-phase track and keeping LLM-first tokenization as a reference or fallback path? [Conflict, Spec §FR-001, Research §Treat local tokenization as the preferred track]
- [ ] CHK029 Does the spec clearly distinguish what belongs in the tokenizer spike requirements versus what belongs in the separate provider fallback specification? [Ambiguity, Spec §User Story 1, Spec §User Story 2]
- [ ] CHK030 If the shared benchmark scale is required in the data model, is that scale itself defined anywhere in the requirements set? [Gap, Data Model §Tokenization Evaluation Result]
