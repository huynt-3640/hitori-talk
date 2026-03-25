import { OPENROUTER_CONFIG } from '@/config/constants';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function chatCompletion(
  messages: ChatMessage[],
  model: string = OPENROUTER_CONFIG.DEFAULT_MODEL
): Promise<OpenRouterResponse> {
  const response = await fetch(OPENROUTER_CONFIG.BASE_URL, {
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

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  return response.json() as Promise<OpenRouterResponse>;
}
