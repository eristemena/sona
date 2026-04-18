# SQLite Concurrency Checklist: Feasibility Spike Foundation

**Purpose**: Validate the quality of the SQLite concurrency spike requirements so reviewers can assess whether the written requirements are complete, measurable, and useful for implementation planning.
**Created**: 2026-04-18
**Feature**: [spec.md](../spec.md)

**Note**: This checklist tests the quality of the concurrency benchmark requirements, not whether the benchmark implementation passes.

## Requirement Completeness

- [ ] CHK001 Are the overlapping workloads explicitly enumerated beyond annotation refresh and SRS harvest if any additional concurrent operations are expected in the spike? [Completeness, Spec §User Story 3, Spec §FR-007]
- [ ] CHK002 Are the baseline hardware requirements defined precisely enough that reviewers can determine whether a run qualifies as representative 2019-era hardware? [Gap, Spec §Independent Test, Spec §FR-007]
- [ ] CHK003 Are the required report contents complete across workload assumptions, responsiveness observations, pass or fail status, bottlenecks, and mitigations? [Completeness, Spec §FR-008, Spec §Concurrency Benchmark Run, Artifact Contract §SQLite Concurrency Report]
- [ ] CHK004 Does the requirements set explicitly state which SQLite configuration details must be captured, including WAL mode and checkpoint policy? [Completeness, Research §Use better-sqlite3 with WAL mode and benchmark a single-writer policy, Data Model §Concurrency Benchmark Run]
- [ ] CHK005 Are provenance requirements complete for benchmark inputs, derived study candidates, and source material touched during concurrent processing? [Completeness, Spec §FR-009, Data Model §Study Candidate Provenance Record]

## Requirement Clarity

- [ ] CHK006 Is "learner-visible responsiveness" defined with enough specificity to distinguish UI blocking from background completion time? [Clarity, Spec §FR-007, Spec §SC-005]
- [ ] CHK007 Is the target window for benchmark completion clear about whether the 30-second limit applies to total elapsed work, wall-clock completion, or only critical-path operations? [Ambiguity, Spec §Acceptance Scenarios, Spec §SC-005]
- [ ] CHK008 Are "contention" and "latency spikes" defined with a consistent threshold or taxonomy so reviewers can judge whether report findings are sufficiently detailed? [Clarity, Spec §Acceptance Scenarios, Spec §FR-008]
- [ ] CHK009 Is the term "baseline hardware" clarified with CPU, memory, storage, or device-class guidance rather than relying on an approximate year label alone? [Ambiguity, Spec §User Story 3, Spec §FR-007]
- [ ] CHK010 Are "required mitigations" described clearly enough to distinguish mandatory planning blockers from optional optimizations? [Clarity, Spec §FR-008]

## Requirement Consistency

- [ ] CHK011 Do the concurrency requirements stay consistent with the research decision to benchmark WAL mode and a single-writer or queued-write policy? [Consistency, Research §Use better-sqlite3 with WAL mode and benchmark a single-writer policy, Spec §FR-007]
- [ ] CHK012 Are the required report fields consistent between the spec narrative, the data model, and the artifact contract? [Consistency, Spec §FR-008, Data Model §Concurrency Benchmark Run, Artifact Contract §SQLite Concurrency Report]
- [ ] CHK013 Do the bounded-review implications of concurrency findings align with the broader requirement to avoid sudden catch-up burden from delayed harvesting? [Consistency, Spec §Review Load & Recovery, Spec §FR-010]
- [ ] CHK014 Are provenance expectations consistent between benchmark artifacts and the data model rule that later planning must preserve derivation linkage? [Consistency, Spec §FR-009, Data Model §Study Candidate Provenance Record]

## Acceptance Criteria Quality

- [ ] CHK015 Can the concurrency spike be objectively marked pass, warn, or fail based on the current success criteria, or is decision logic missing between threshold breaches and report outcomes? [Measurability, Spec §SC-005, Artifact Contract §SQLite Concurrency Report]
- [ ] CHK016 Are the responsiveness criteria measurable enough to evaluate more than one learner interaction during a run, rather than only one peak block sample? [Measurability, Spec §SC-005]
- [ ] CHK017 Are workload assumptions measurable if dataset size and concurrency intensity are not predeclared in the requirements? [Gap, Measurability, Spec §FR-008, Artifact Contract §SQLite Concurrency Report]

## Scenario Coverage

- [ ] CHK018 Are alternate scenarios defined for benchmarks that meet the total completion target but fail the UI blocking target, or vice versa? [Coverage, Gap, Spec §SC-005]
- [ ] CHK019 Are exception scenarios specified for cases where contention prevents one job from finishing, causes excessive WAL growth, or requires checkpoint intervention? [Coverage, Gap, Data Model §Concurrency Benchmark Run, Research §Use better-sqlite3 with WAL mode and benchmark a single-writer policy]
- [ ] CHK020 Are recovery-path requirements defined for how planning should proceed when the concurrency spike fails thresholds on representative hardware? [Recovery, Gap, Spec §Acceptance Scenarios, Spec §FR-008]

## Edge Case Coverage

- [ ] CHK021 Are requirements explicit about how small datasets, oversized datasets, or skewed candidate counts affect the validity of the concurrency benchmark? [Edge Case, Gap, Artifact Contract §SQLite Concurrency Report]
- [ ] CHK022 Does the requirements set define whether the benchmark must cover repeated runs, cold starts, or checkpoint-heavy conditions rather than a single idealized execution? [Edge Case, Gap, Research §Use better-sqlite3 with WAL mode and benchmark a single-writer policy]
- [ ] CHK023 Are requirements defined for how interrupted or partially completed runs should be recorded so failed spike executions remain useful planning evidence? [Edge Case, Gap, Spec §FR-008, Artifact Contract §Rules]

## Non-Functional Requirements

- [ ] CHK024 Are offline-only and local-first constraints explicit enough to verify that benchmark execution and artifact consumption require no network access? [Non-Functional, Spec §Local Data & Privacy, Artifact Contract §Rules]
- [ ] CHK025 Are storage-growth expectations specified well enough to judge whether WAL growth is acceptable on baseline machines? [Non-Functional, Gap, Data Model §Concurrency Benchmark Run]
- [ ] CHK026 Are architectural-boundary requirements clear enough to show where benchmark execution, database access, and reporting should live relative to the renderer boundary? [Non-Functional, Research §Electron guidance recommends a preload script with contextBridge]

## Dependencies & Assumptions

- [ ] CHK027 Are the assumptions about corpus size, candidate volume, and harvest frequency documented instead of being inferred during implementation? [Assumption, Spec §Assumptions, Spec §FR-008]
- [ ] CHK028 Is the dependency between concurrency findings and later FSRS-backed review planning explicit enough to avoid hidden scheduling risk? [Dependency, Research §Adopt ts-fsrs for later scheduling, Spec §FR-010]

## Ambiguities & Conflicts

- [ ] CHK029 Is there any conflict between the desire for detailed bottleneck evidence and the requirement to keep the feasibility artifact lightweight and immediately useful for planning? [Conflict, Spec §FR-008, Artifact Contract §Rules]
- [ ] CHK030 Does the requirements set clearly distinguish benchmark-policy questions from later implementation details such as exact queue design or worker scheduling strategy? [Ambiguity, Research §Use better-sqlite3 with WAL mode and benchmark a single-writer policy]
- [ ] CHK031 If WAL checkpoint monitoring is expected, is the required checkpoint signal or threshold defined anywhere in the requirements set? [Gap, Research §Use better-sqlite3 with WAL mode and benchmark a single-writer policy, Data Model §Concurrency Benchmark Run]