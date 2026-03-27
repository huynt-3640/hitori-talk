export const MAX_CONVERSATION_LENGTH = 20;
export const MAX_HISTORY_LENGTH = 10;
export const MAX_CONVERSATIONS_PER_DAY = 50;

export const XP_VALUES = {
  MESSAGE_SENT: 10,
  MESSAGE_WITH_CORRECTION: 15,
  CORRECTION_APPLIED: 5,
  CONVERSATION_COMPLETE: 50,
} as const;

export const STREAK_BONUS_MULTIPLIER = 1.5;
export const XP_PER_LEVEL = 1000;

export const OPENROUTER_CONFIG = {
  BASE_URL: 'https://openrouter.ai/api/v1/chat/completions',
  DEFAULT_MODEL: 'minimax/minimax-m2.5:free',
  FALLBACK_MODEL: 'stepfun/step-3.5-flash:free',
  CONTEXT_MODEL: 'stepfun/step-3.5-flash:free',
  MAX_TOKENS: 1024,
  TEMPERATURE: 0.7,
} as const;

export const MODEL_CONFIG = {
  primary: 'minimax/minimax-m2.5:free',
  context_generation: 'stepfun/step-3.5-flash:free',
  fallback: 'stepfun/step-3.5-flash:free',
} as const;

export const GEMINI_CONFIG = {
  BASE_URL: 'https://aiplatform.googleapis.com/v1/publishers/google/models',
  DEFAULT_MODEL: 'gemini-3-flash-preview',
  MAX_TOKENS: 2048,
  TEMPERATURE: 0.7,
} as const;

export const GOOGLE_TTS_CONFIG = {
  BASE_URL: 'https://texttospeech.googleapis.com/v1/text:synthesize',
  VOICE: {
    languageCode: 'ja-JP',
    name: 'ja-JP-Neural2-B',
    ssmlGender: 'FEMALE' as const,
  },
  AUDIO_CONFIG: {
    audioEncoding: 'MP3' as const,
    speakingRate: 0.9,
    pitch: 0,
  },
} as const;

export const GOOGLE_STT_CONFIG = {
  BASE_URL: 'https://speech.googleapis.com/v1/speech:recognize',
  LANGUAGE_CODE: 'ja-JP',
  ENCODING: 'WEBM_OPUS',
  SAMPLE_RATE: 48000,
} as const;

export const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export const ONBOARDING_TEST_MESSAGES = 5;

export const TOPIC_CATEGORIES = ['Work', 'Technical', 'Business', 'Casual'] as const;
