# Data Model: Feasibility Spike Foundation

## Corpus Segment

Purpose: Represents a learner-approved Korean text unit used in the tokenization and derivation spikes.

Fields:
- `id`: Stable local identifier.
- `sourceId`: Identifier of the parent article, subtitle file, or sentence set.
- `sourceType`: One of `article`, `subtitle`, `generated-sentence`, or `other-approved-source`.
- `stratum`: Corpus bucket used for sampling and reporting.
- `text`: Original Korean text for the segment.
- `startOffset`: Optional source offset or subtitle timing start.
- `endOffset`: Optional source offset or subtitle timing end.
- `learnerApproved`: Boolean confirming the source is allowed in the pipeline.
- `capturedAt`: Local timestamp for fixture ingestion.

Validation rules:
- `text` must be non-empty.
- `sourceType` and `stratum` must be present.
- Timing offsets are required for subtitle-backed segments.
- Only learner-approved segments are valid spike inputs.

Relationships:
- One `Corpus Segment` can produce many `Tokenization Evaluation Result` rows.
- One `Corpus Segment` can map to many `Study Candidate Provenance Record` rows.

## Tokenization Evaluation Result

Purpose: Captures the measured quality and failure profile of one tokenization track against one segment or stratum.

Fields:
- `id`: Stable local identifier.
- `segmentId`: Reference to `Corpus Segment`.
- `track`: One of `local-js-segmenter`, `llm-fallback-reference`, or another evaluated tokenizer.
- `granularity`: One of `segment`, `batch`, or `stratum`.
- `accuracyScore`: Quantitative quality metric used by the spike.
- `errorClasses`: Structured list of error categories.
- `learnerImpact`: Description of downstream impact on lookup, annotation, or card harvest.
- `recommendedDisposition`: One of `proceed`, `revise`, `defer`, `fallback-only`.
- `notes`: Freeform supporting observation text.

Validation rules:
- `track`, `segmentId`, and `recommendedDisposition` are required.
- `accuracyScore` must use the shared benchmark scale.
- `learnerImpact` is required whenever `recommendedDisposition` is not `proceed`.

State transitions:
- `captured` -> `reviewed` -> `accepted-for-plan` or `flagged-for-mitigation`.

## Provider Fallback Policy

Purpose: Defines when optional provider-assisted behavior is eligible, invoked, capped, or denied.

Fields:
- `id`: Stable local identifier.
- `featureArea`: One of `tokenization-help`, `annotation-help`, `translation-help`, `tts`, or similar.
- `providerType`: One of `openai`, `anthropic`, `google-cloud-tts`, or `none`.
- `eligibilityRule`: Human-readable and machine-checkable trigger conditions.
- `requestContractRef`: Reference to the prompt/input contract.
- `latencyBudgetMs`: Max allowed wait time before graceful degradation.
- `sessionUsageCap`: Max invocations or spend within a session.
- `costModel`: Pricing assumptions used for planning.
- `noKeyBehavior`: Explicit fallback behavior when credentials are absent.
- `failureBehavior`: Fallback behavior when requests fail or exceed policy.

Validation rules:
- `featureArea`, `latencyBudgetMs`, `sessionUsageCap`, `noKeyBehavior`, and `failureBehavior` are required.
- `providerType` can be `none` only when the policy represents the local-only path.
- `latencyBudgetMs` must map to the spec budgets: 3000 ms inline, 10000 ms audio.

State transitions:
- `disabled` -> `eligible` -> `invoked` -> `completed` or `degraded`.
- `disabled` -> `local-only` when no API key exists.

## Concurrency Benchmark Run

Purpose: Records one execution of the SQLite concurrency spike on baseline hardware.

Fields:
- `id`: Stable local identifier.
- `hardwareProfile`: Baseline machine description.
- `databaseMode`: SQLite mode and pragmas, including WAL and checkpoint policy.
- `overlappingJobs`: List of concurrent workloads under test.
- `datasetSize`: Corpus and review-harvest scale used for the run.
- `totalCompletionMs`: End-to-end duration.
- `maxUiBlockMs`: Largest learner-visible blocking event.
- `walSizeBytes`: Observed WAL growth during the run.
- `passFail`: One of `pass`, `warn`, or `fail`.
- `bottlenecks`: List of contention or locking findings.
- `mitigations`: Recommended follow-up changes.

Validation rules:
- `hardwareProfile`, `overlappingJobs`, `totalCompletionMs`, `maxUiBlockMs`, and `passFail` are required.
- `passFail = pass` requires both timing thresholds to be met.

State transitions:
- `planned` -> `running` -> `recorded` -> `accepted-for-plan` or `requires-mitigation`.

## Study Candidate Provenance Record

Purpose: Preserves the relationship between an original source segment and any derived annotation or review candidate considered in the spike.

Fields:
- `id`: Stable local identifier.
- `segmentId`: Reference to `Corpus Segment`.
- `candidateType`: One of `annotation`, `lookup`, `review-card-seed`, or `audio-job`.
- `derivationTrack`: Local or provider-assisted decision path.
- `tokenizationResultId`: Optional link to the tokenization output that produced the candidate.
- `providerPolicyId`: Optional link to the fallback policy in use.
- `createdAt`: Local timestamp.

Validation rules:
- `segmentId`, `candidateType`, and `derivationTrack` are required.
- Provider-linked candidates require a `providerPolicyId`.

Relationships:
- Many provenance records may reference one corpus segment.
- A provenance record may reference one tokenization result and zero or one provider fallback policy.
