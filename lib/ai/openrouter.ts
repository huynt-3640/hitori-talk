import { OPENROUTER_CONFIG } from '@/config/constants';
import type { ChatMessage, ChatResponse } from './types';

async function callOpenRouter(
  messages: ChatMessage[],
  model: string
): Promise<Response> {
  return fetch(OPENROUTER_CONFIG.BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'Hitori Talk',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: OPENROUTER_CONFIG.MAX_TOKENS,
      temperature: OPENROUTER_CONFIG.TEMPERATURE,
    }),
  });
}

export async function openRouterChatCompletion(
  messages: ChatMessage[],
  model: string = OPENROUTER_CONFIG.DEFAULT_MODEL
): Promise<ChatResponse> {
  let response = await callOpenRouter(messages, model);

  // Fallback to secondary model on payment/rate limit errors
  if (!response.ok && model !== OPENROUTER_CONFIG.FALLBACK_MODEL) {
    console.warn(
      `OpenRouter primary model (${model}) failed with ${response.status}, trying fallback (${OPENROUTER_CONFIG.FALLBACK_MODEL})`
    );
    response = await callOpenRouter(messages, OPENROUTER_CONFIG.FALLBACK_MODEL);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  return {
    content,
    usage: {
      prompt_tokens: data.usage?.prompt_tokens ?? 0,
      completion_tokens: data.usage?.completion_tokens ?? 0,
      total_tokens: data.usage?.total_tokens ?? 0,
    },
  };
}
