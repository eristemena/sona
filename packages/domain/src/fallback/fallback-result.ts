export interface FallbackResult {
  requestId: string
  status: 'completed' | 'degraded' | 'denied'
  providerLatencyMs: number
  estimatedCostUsd: number
  responsePayload: Record<string, unknown>
  fallbackApplied: boolean
  fallbackReason?: 'no-key' | 'timeout' | 'cap-exceeded' | 'provider-error' | 'policy-denied'
}

export function createDegradedFallbackResult(requestId: string, reason: NonNullable<FallbackResult['fallbackReason']>): FallbackResult {
  return {
    requestId,
    status: reason === 'policy-denied' ? 'denied' : 'degraded',
    providerLatencyMs: 0,
    estimatedCostUsd: 0,
    responsePayload: {},
    fallbackApplied: true,
    fallbackReason: reason,
  }
}
export interface FallbackResult {
  requestId: string
  status: 'completed' | 'degraded' | 'denied'
  providerLatencyMs: number
  estimatedCostUsd: number
  responsePayload: Record<string, unknown>
  fallbackApplied: boolean
  fallbackReason?: 'no-key' | 'timeout' | 'cap-exceeded' | 'provider-error' | 'policy-denied'
}

export function createDegradedFallbackResult(requestId: string, reason: NonNullable<FallbackResult['fallbackReason']>): FallbackResult {
  return {
    requestId,
    status: reason === 'policy-denied' ? 'denied' : 'degraded',
    providerLatencyMs: 0,
    estimatedCostUsd: 0,
    responsePayload: {},
    fallbackApplied: true,
    fallbackReason: reason,
  }
}
