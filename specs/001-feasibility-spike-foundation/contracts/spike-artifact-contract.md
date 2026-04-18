# Contract: Spike Artifact Contract

This contract defines the minimum artifact structure the three feasibility spikes must emit so planning and later task generation can consume their outputs consistently.

## Tokenizer Report

```json
{
  "reportId": "string",
  "generatedAt": "ISO-8601 timestamp",
  "tracks": ["local-js-segmenter", "llm-fallback-reference"],
  "strata": [
    {
      "name": "string",
      "segmentCount": 0,
      "accuracyScore": 0,
      "errorClasses": ["string"],
      "learnerImpact": "string",
      "recommendedDisposition": "proceed|revise|defer|fallback-only"
    }
  ],
  "recommendedTrack": "string",
  "openRisks": ["string"]
}
```

## LLM Fallback Spec Artifact

```json
{
  "artifactId": "string",
  "generatedAt": "ISO-8601 timestamp",
  "policies": [
    {
      "featureArea": "string",
      "providerOptions": ["openai", "anthropic", "google-cloud-tts", "none"],
      "latencyBudgetMs": 0,
      "sessionUsageCap": {
        "maxCalls": 0,
        "maxEstimatedCostUsd": 0
      },
      "promptTemplateRef": "string",
      "noKeyBehavior": "string",
      "failureBehavior": "string"
    }
  ],
  "sessionBudgetMinutes": 30
}
```

## SQLite Concurrency Report

```json
{
  "runId": "string",
  "generatedAt": "ISO-8601 timestamp",
  "hardwareProfile": "string",
  "databaseMode": {
    "journalMode": "WAL",
    "checkpointPolicy": "string"
  },
  "overlappingJobs": ["annotation-refresh", "srs-harvest"],
  "datasetSize": {
    "segments": 0,
    "candidates": 0
  },
  "totalCompletionMs": 0,
  "maxUiBlockMs": 0,
  "walSizeBytes": 0,
  "passFail": "pass|warn|fail",
  "bottlenecks": ["string"],
  "mitigations": ["string"]
}
```

Rules:
- Every artifact must be written locally.
- Every artifact must include a stable ID and generation timestamp.
- Every artifact must be consumable without network access after it is generated.
