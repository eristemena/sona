## Read First

- If a feature plan exists under `specs/<feature>/plan.md`, read it before making changes.
- Treat [.specify/memory/constitution.md](../.specify/memory/constitution.md) as the non-negotiable product and architecture gate.
- Treat [DESIGN.md](../DESIGN.md) as the UI source of truth for layout, tokens, typography, motion, accessibility, and anti-patterns.

## Project Reality

- This repository is currently a Spec Kit scaffold, not a finished application codebase.
- Do not infer the runtime stack from the repo state. There is no `src/`, `tests/`, or production app scaffold yet.
- The only npm script today is a placeholder failing test command in [package.json](../package.json).

## Non-Negotiables

- Preserve local-first behavior. Core study flows must not require accounts, cloud persistence, telemetry, or mandatory network access.
- Preserve learner-owned provenance. Learner-supplied or learner-approved content is the source of truth, and derived study material must remain inspectable and editable.
- Keep review load bounded. Any feature that creates scheduled work must define caps, pacing, deferment, and backlog recovery.
- Keep reading, listening, and review state connected, with explicit fallback behavior when TTS or audio is unavailable.
- Justify new dependencies, services, background processes, or vendor lock-in before introducing them.

## Workflow

- For substantive new work, prefer the Spec Kit flow: specify -> plan -> tasks -> implement.
- Use the active feature directory under `specs/` as the source of truth for feature-specific decisions.
- Do not duplicate long policy or design content in new instruction files; link to the authoritative docs instead.
- Any change affecting persistence, scheduling, content derivation, import/export, or TTS/audio must include automated regression coverage.
- Purely presentational work should still include explicit manual verification steps.

## Useful References

- Constitution: [.specify/memory/constitution.md](../.specify/memory/constitution.md)
- UI design system: [DESIGN.md](../DESIGN.md)
- Feature spec template: [.specify/templates/spec-template.md](../.specify/templates/spec-template.md)
- Plan template: [.specify/templates/plan-template.md](../.specify/templates/plan-template.md)
- Tasks template: [.specify/templates/tasks-template.md](../.specify/templates/tasks-template.md)
- Spec Kit git workflow: [.specify/extensions/git/README.md](../.specify/extensions/git/README.md)
- Hook configuration: [.specify/extensions.yml](../.specify/extensions.yml)
