import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatCompletion } from '@/lib/ai/chat';
import { buildContextGenerationPrompt } from '@/lib/ai/prompts';
import { parseJsonResponse } from '@/lib/ai/parse-json-response';
import type { JLPTLevel } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic_id } = await request.json();
    if (!topic_id) {
      return NextResponse.json({ error: 'topic_id is required' }, { status: 400 });
    }

    // Fetch topic and profile
    const [topicResult, profileResult] = await Promise.all([
      supabase.from('topics').select('*').eq('id', topic_id).single(),
      supabase.from('profiles').select('jlpt_level').eq('id', user.id).single(),
    ]);

    if (topicResult.error || !topicResult.data) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const topic = topicResult.data;
    const jlptLevel = (profileResult.data?.jlpt_level ?? 'N5') as JLPTLevel;

    // Generate context using AI
    const contextPrompt = buildContextGenerationPrompt(
      topic.context_generation_prompt,
      jlptLevel
    );

    const contextResponse = await chatCompletion(
      [{ role: 'user', content: contextPrompt }]
    );

    let context: { ai_role: string; scenario: string; greeting: string; greeting_translation: string };
    try {
      const parsed = parseJsonResponse(contextResponse.content);
      context = {
        ai_role: (parsed.ai_role as string) || 'Japanese colleague',
        scenario: (parsed.scenario as string) || topic.description,
        greeting: (parsed.greeting as string) || 'こんにちは！よろしくお願いします。',
        greeting_translation: (parsed.greeting_translation as string) || '',
      };
    } catch {
      // Fallback if AI doesn't return valid JSON
      context = {
        ai_role: 'Japanese colleague',
        scenario: topic.description,
        greeting: 'こんにちは！よろしくお願いします。',
        greeting_translation: 'Xin chào! Rất vui được làm việc cùng bạn.',
      };
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        topic_id: topic.id,
        title: topic.title,
        status: 'active',
        ai_role: context.ai_role,
        context_details: { scenario: context.scenario },
      })
      .select('id')
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Insert AI greeting message with translation
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: context.greeting,
      translation: context.greeting_translation || null,
    });

    return NextResponse.json({ id: conversation.id });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
