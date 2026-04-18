<!--
Sync Impact Report
Version change: N/A -> 1.0.0
Modified principles:
- Template Principle 1 -> I. Local-First Learning
- Template Principle 2 -> II. Learner-Owned Content Pipeline
- Template Principle 3 -> III. Bounded Review Load
- Template Principle 4 -> IV. Listening and Reading Reinforce Each Other
- Template Principle 5 -> V. Personal-Use Simplicity, Public-Ready Architecture
Added sections:
- Product Boundaries
- Delivery Workflow
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
Follow-up TODOs:
- None
-->
# Sona Constitution

## Core Principles

### I. Local-First Learning
Sona MUST store learner content, schedules, progress, generated study material,
and settings on the local device by default. Core study flows MUST NOT require
accounts, remote persistence, telemetry, or cloud-only processing. Any future
network capability MUST be strictly additive, disabled by default, and unable to
change the offline learning loop.

Rationale: privacy, ownership, and offline reliability are product promises, not
implementation details.

### II. Learner-Owned Content Pipeline
Every learning loop MUST begin from learner-supplied or learner-approved
material, such as articles, drama subtitles, or generated sentences saved
locally. Derived notes, cards, and listening drills MUST preserve source
provenance and remain editable by the learner. Features MUST NOT hide study
value inside opaque automation that the learner cannot inspect or correct.

Rationale: Sona exists to turn unlimited personal content into durable study
material without replacing the learner's agency.

### III. Bounded Review Load
Features that create vocabulary cards, listening drills, or any scheduled work
MUST declare how new items are introduced, capped, deferred, and recovered after
missed days. Default behavior MUST optimize for a calm, sustainable workload
instead of maximum throughput. Backlog recovery MUST avoid forcing a learner
through an unbounded catch-up session.

Rationale: review must stay useful at scale, or the product fails its core
purpose.

### IV. Listening and Reading Reinforce Each Other
Study flows MUST treat text, audio, and review state as one connected learning
system. Features that add listening practice MUST keep the underlying text and
vocabulary context accessible. Features that derive text study material MUST
retain a path into pronunciation or listening practice whenever the source and
tooling permit it, including clear fallback behavior when TTS is unavailable.

Rationale: Korean acquisition improves faster when reading, pronunciation, and
review are designed together rather than as isolated tools.

### V. Personal-Use Simplicity, Public-Ready Architecture
Sona MUST stay simple enough for single-user maintenance while remaining ready
for public sharing without architectural rewrites. New dependencies, services,
background processes, or vendor lock-in require explicit justification in the
plan, especially if they raise install complexity or operating burden. Data
formats, configuration, and migration paths MUST assume future public release
even while the product is built first for personal use.

Rationale: the app is personal-first, but the architecture must not trap future
distribution behind a redesign.

## Product Boundaries

- Sona MUST optimize for self-directed Korean language study on desktop-class
	environments first.
- The product MUST support learner-provided source material as the primary path
	to new study content; generated material may supplement that flow but MUST NOT
	become the only meaningful path.
- The product MUST remain usable without subscriptions, user identity,
	multi-tenant infrastructure, or mandatory online services.
- Changes to persistence MUST preserve existing learner data through explicit
	migrations, import/export compatibility, or documented recovery steps.

## Delivery Workflow

- Every specification MUST document the local data it creates or mutates, the
	source provenance it preserves, the review-load impact it introduces, and any
	offline or TTS fallback behavior.
- Every implementation plan MUST pass a Constitution Check covering local-first
	operation, learner-owned content, bounded review load, listening and reading
	integration, and complexity justification for any new dependency.
- Any feature that changes scheduling, persistence, content derivation,
	import/export, or TTS orchestration MUST include automated regression coverage
	plus a manual acceptance path from import to study to review.
- Release readiness MUST verify offline startup, upgrade safety for existing
	learner data, and that no new flow silently introduces account or cloud
	requirements.

## Governance

- This constitution supersedes conflicting project habits, ad hoc preferences,
	and temporary implementation shortcuts.
- Amendments MUST be made in the same change as any required template or process
	updates, with a short rationale and impact statement recorded in the Sync
	Impact Report.
- Compliance MUST be reviewed at specification, planning, task generation, and
	code review time. A change that fails a constitution gate MUST either be
	revised or carry an explicit, time-bounded exception approved in writing.
- Versioning follows semantic versioning for governance documents: MAJOR for
	incompatible principle changes or removals, MINOR for new principles or
	materially expanded guidance, and PATCH for clarifications that do not change
	meaning.
- Operational guidance may evolve in other files, but those files MUST remain
	consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-04-18 | **Last Amended**: 2026-04-18
