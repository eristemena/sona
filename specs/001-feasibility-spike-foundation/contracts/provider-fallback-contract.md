# Contract: Provider Fallback Contract

This contract defines the request, policy, and result shape for optional provider-assisted language and audio features. All fields are local-first and must support a no-key path.

## Policy Object

```json
{
  "policyId": "string",
  "featureArea": "tokenization-help|annotation-help|translation-help|tts",
  "providerType": "openai|anthropic|google-cloud-tts|none",
  "enabled": true,
  "latencyBudgetMs": 3000,
  "sessionUsageCap": {
    "maxCalls": 0,
    "maxEstimatedCostUsd": 0
  },
  "noKeyBehavior": "string",
  "failureBehavior": "string"
}
```

Rules:
- `providerType` must be `none` when the policy describes the local-only path.
- `latencyBudgetMs` must be `3000` for inline study assistance or `10000` for audio generation.
- `noKeyBehavior` must preserve learner progress and leave the feature in a usable local-only state.

## Prompt/Request Object

```json
{
  "requestId": "string",
  "policyId": "string",
  "sourceSegmentId": "string",
  "featureArea": "tokenization-help|annotation-help|translation-help|tts",
  "payload": {
    "text": "string",
    "metadata": {
      "sourceType": "article|subtitle|generated-sentence|other-approved-source",
      "stratum": "string"
    }
  },
  "promptTemplateRef": "string",
  "startedAt": "ISO-8601 timestamp"
}
```

Rules:
- Only learner-approved text may appear in `payload.text`.
- `promptTemplateRef` must point to a versioned local prompt file or embedded template identifier.
- Audio requests must identify the text source so provenance remains intact.

## Result Object

```json
{
  "requestId": "string",
  "status": "completed|degraded|denied",
  "providerLatencyMs": 0,
  "estimatedCostUsd": 0,
  "responsePayload": {},
  "fallbackApplied": true,
  "fallbackReason": "no-key|timeout|cap-exceeded|provider-error|policy-denied"
}
```

Rules:
- `status` must be `denied` when policy blocks execution before a provider call.
- `status` must be `degraded` when execution begins but returns to the local-only path.
- `fallbackApplied` must be `true` for all `degraded` and `denied` results.
