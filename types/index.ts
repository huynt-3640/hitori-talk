export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type ConversationStatus = 'active' | 'completed' | 'abandoned';
export type MessageRole = 'user' | 'assistant';
export type MistakeType = 'grammar' | 'vocabulary' | 'particle' | 'conjugation' | 'politeness';

export interface Correction {
  type: MistakeType;
  original: string;
  corrected: string;
  explanation: string;
}

export interface AIResponse {
  response: string;
  corrections: Correction[] | null;
  translation: string;
}

export interface ContextDetails {
  ai_role: string;
  user_role: 'developer';
  scenario_title: string;
  description_vi: string;
  description_ja: string;
  expected_topics: Array<{ ja: string; vi: string }>;
  example_phrases: Array<{ ja: string; romaji?: string; vi: string }>;
}
