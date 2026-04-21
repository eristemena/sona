export interface TtsProviderRequest {
  text: string;
  modelId: string;
  voice: string;
  instructions?: string;
  format: "mp3" | "wav";
}

export interface TtsTimingEntry {
  surface: string;
  startMs: number;
  endMs: number;
}

export interface TtsProviderResponse {
  audioData: Uint8Array;
  contentType: string;
  latencyMs: number;
  estimatedCostUsd: number | null;
  durationMs: number | null;
  timings?: TtsTimingEntry[];
}

export interface TtsProviderAdapter {
  id: "openai";
  synthesize(request: TtsProviderRequest): Promise<TtsProviderResponse>;
}
