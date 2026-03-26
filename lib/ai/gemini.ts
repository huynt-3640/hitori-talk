import { GEMINI_CONFIG } from '@/config/constants';
import type { ChatMessage, ChatResponse } from './types';

interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[];
    };
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export async function geminiChatCompletion(
  messages: ChatMessage[],
  model: string = GEMINI_CONFIG.DEFAULT_MODEL
): Promise<ChatResponse> {
  // Separate system instruction from conversation messages
  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  // Convert to Gemini format
  const contents: GeminiContent[] = conversationMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: GEMINI_CONFIG.MAX_TOKENS,
      temperature: GEMINI_CONFIG.TEMPERATURE,
    },
  };

  // Add system instruction if present
  if (systemMessages.length > 0) {
    body.systemInstruction = {
      parts: [{ text: systemMessages.map((m) => m.content).join('\n') }],
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const url = `${GEMINI_CONFIG.BASE_URL}/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  return {
    content: text,
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens: data.usageMetadata?.totalTokenCount ?? 0,
    },
  };
}
