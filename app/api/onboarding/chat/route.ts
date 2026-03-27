import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatCompletion } from '@/lib/ai/chat';
import {
  buildOnboardingSystemPrompt,
  buildOnboardingGreetingPrompt,
  buildEvaluationPrompt,
} from '@/lib/ai/onboarding-prompts';
import { parseJsonResponse } from '@/lib/ai/parse-json-response';
import { ONBOARDING_TEST_MESSAGES } from '@/config/constants';
import type { JLPTLevel, SupportedLanguage } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, jlpt_level, message, history } = await request.json();
    const level = (jlpt_level || 'N5') as JLPTLevel;

    // Fetch user's preferred language
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', user.id)
      .single();
    const lang = (profile?.preferred_language ?? 'vi') as SupportedLanguage;

    // Generate initial greeting
    if (action === 'greeting') {
      const prompt = buildOnboardingGreetingPrompt(level, lang);
      const result = await chatCompletion([{ role: 'user', content: prompt }]);

      try {
        const parsed = parseJsonResponse(result.content);
        return NextResponse.json({
          response: parsed.response || 'こんにちは！お仕事について教えてください。',
          translation: parsed.translation || (lang === 'vi'
            ? 'Xin chào! Hãy kể cho tôi về công việc của bạn.'
            : 'Hello! Tell me about your work.'),
        });
      } catch {
        return NextResponse.json({
          response: 'こんにちは！IT業界で働いているそうですね。どんなお仕事をされていますか？',
          translation: lang === 'vi'
            ? 'Xin chào! Nghe nói bạn làm trong ngành IT. Bạn làm công việc gì vậy?'
            : 'Hello! I heard you work in IT. What kind of work do you do?',
        });
      }
    }

    // Handle chat message
    if (action === 'chat') {
      if (!message?.trim()) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
      }

      const systemPrompt = buildOnboardingSystemPrompt(level, lang);
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...(history || []).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: message.trim() },
      ];

      const result = await chatCompletion(messages);

      try {
        const parsed = parseJsonResponse(result.content);
        // Count user messages in history + current one
        const userMessageCount = (history || []).filter((m: { role: string }) => m.role === 'user').length + 1;
        const isComplete = userMessageCount >= ONBOARDING_TEST_MESSAGES;

        return NextResponse.json({
          response: parsed.response || result.content,
          corrections: parsed.corrections || null,
          translation: parsed.translation || null,
          isComplete,
        });
      } catch {
        return NextResponse.json({
          response: result.content,
          corrections: null,
          translation: null,
          isComplete: false,
        });
      }
    }

    // Evaluate level
    if (action === 'evaluate') {
      if (!history?.length) {
        return NextResponse.json({ error: 'History is required' }, { status: 400 });
      }

      const evalPrompt = buildEvaluationPrompt(level, history, lang);
      const result = await chatCompletion([{ role: 'user', content: evalPrompt }]);

      try {
        const parsed = parseJsonResponse(result.content);
        return NextResponse.json({
          evaluated_level: parsed.evaluated_level || level,
          reasoning: parsed.reasoning || '',
        });
      } catch {
        return NextResponse.json({
          evaluated_level: level,
          reasoning: lang === 'vi'
            ? 'Không thể đánh giá tự động. Sử dụng level bạn đã chọn.'
            : 'Could not evaluate automatically. Using your selected level.',
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Onboarding chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
