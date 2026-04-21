export interface ReadingAnnotationLookupRequest {
  token: string;
  sentenceContext: string;
  canonicalForm?: string;
}

export interface ReadingGrammarExplanationRequest extends ReadingAnnotationLookupRequest {
  canonicalForm: string;
}

export interface ReadingAnnotationResponse {
  canonicalForm: string;
  surface: string;
  meaning: string;
  romanization: string;
  pattern: string;
  register: string;
  sentenceTranslation: string;
  grammarExplanation: string | null;
  modelId: string;
  responseJson: string;
}

export interface ReadingAnnotationProviderAdapter {
  id: "openrouter";
  modelId: string;
  lookupWord(
    request: ReadingAnnotationLookupRequest,
  ): Promise<ReadingAnnotationResponse>;
  explainGrammar(
    request: ReadingGrammarExplanationRequest,
  ): Promise<ReadingAnnotationResponse>;
}
