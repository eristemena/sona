# Quickstart: Feasibility Spike Foundation

This feature is a planning-first feasibility phase. The commands below describe the expected workflow once the implementation scaffold for the desktop app and spikes is created.

## 1. Prerequisites

- Node.js 20 LTS or newer.
- npm available locally.
- A 2019-era baseline machine available for the concurrency benchmark.
- Optional provider credentials only if validating hosted LLM or TTS behavior:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GOOGLE_APPLICATION_CREDENTIALS` for Google Cloud TTS

## 2. Install Dependencies

```bash
npm install
```

## 3. Prepare Local Inputs

- Place the stratified Korean corpus under `fixtures/corpus/`.
- Ensure each segment is tagged by source type and stratum.
- Keep provider keys unset if validating no-key graceful degradation.

## 4. Run the Feasibility Spikes

Expected commands after implementation scaffolding:

```bash
npm run spike:tokenizer
npm run spike:llm-fallback
npm run spike:sqlite-concurrency
```

## 5. Validate Outputs

Expected local outputs:

- `artifacts/tokenizer/report.json`
- `artifacts/llm-fallback/policy.json`
- `artifacts/sqlite-concurrency/report.json`

Validate that:

- Tokenizer results cover every corpus stratum.
- No-key mode leaves core reading and SRS workflows usable.
- SQLite benchmark results show total completion under 30 seconds and learner-visible blocking under 1 second.

## 6. Review Against the Plan

- Compare artifact shapes against [contracts/spike-artifact-contract.md](./contracts/spike-artifact-contract.md).
- Compare provider policy behavior against [contracts/provider-fallback-contract.md](./contracts/provider-fallback-contract.md).
- Confirm any failed thresholds are documented as mitigations before moving to `/speckit.tasks`.

## 7. Latest Verification Notes

- 2026-04-19: `npm test` passed the tokenizer contract and benchmark suite.
- 2026-04-19: `npm run spike:tokenizer` produced `artifacts/tokenizer/report.json` from the local fixture corpus.

## 7. Latest Verification Notes

- 2026-04-19: `npm test` passed the tokenizer contract and benchmark suite.
- 2026-04-19: `npm run spike:tokenizer` produced `artifacts/tokenizer/report.json` from the local fixture corpus.
- 2026-04-19: `npm run spike:llm-fallback` produced `artifacts/llm-fallback/policy.json` with no-key and TTS fallback policies.
- 2026-04-19: `npm run spike:sqlite-concurrency` produced `artifacts/sqlite-concurrency/report.json` using the local SQLite WAL benchmark harness.
