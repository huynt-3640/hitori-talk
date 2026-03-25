export const MAX_CONVERSATION_LENGTH = 20;
export const MAX_HISTORY_LENGTH = 10;
export const XP_PER_MESSAGE = 10;
export const XP_PER_CORRECTION_ACCEPTED = 5;
export const STREAK_BONUS_MULTIPLIER = 1.5;
export const MAX_CONVERSATIONS_PER_DAY = 50;
export const XP_PER_LEVEL = 1000;

export const MODEL_CONFIG = {
  primary: 'anthropic/claude-3.5-sonnet',
  context_generation: 'anthropic/claude-3-haiku',
  fallback: 'openai/gpt-4o-mini',
} as const;

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export const TOPIC_CATEGORIES = ['Work', 'Technical', 'Business', 'Casual'] as const;
