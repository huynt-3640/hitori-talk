import { GEMINI_CONFIG, OPENROUTER_CONFIG } from '@/config/constants';
import { geminiChatCompletion } from './gemini';
import { openRouterChatCompletion } from './openrouter';
import type { ChatMessage, ChatResponse } from './types';

export type { ChatMessage, ChatResponse };

/**
 * Unified chat completion: Gemini (primary) → OpenRouter (fallback)
 * If GEMINI_API_KEY is set, tries Gemini first.
 * Falls back to OpenRouter on any Gemini error.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  model?: string
): Promise<ChatResponse> {
  // Try Gemini first if API key is available
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log(`[AI] Calling Gemini (${GEMINI_CONFIG.DEFAULT_MODEL})`);
      const result = await geminiChatCompletion(messages);
      console.log(`[AI] Gemini responded OK (${result.usage.total_tokens} tokens)`);
      return result;
    } catch (error) {
      console.warn('[AI] Gemini failed, falling back to OpenRouter:', error);
    }
  }

  // Fallback to OpenRouter
  const orModel = model || OPENROUTER_CONFIG.DEFAULT_MODEL;
  console.log(`[AI] Calling OpenRouter (${orModel})`);
  const result = await openRouterChatCompletion(messages, model);
  console.log(`[AI] OpenRouter responded OK (${result.usage.total_tokens} tokens)`);
  return result;
}
