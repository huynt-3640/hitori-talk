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

    const profileResult = await supabase
      .from('profiles')
      .select('jlpt_level')
      .eq('id', user.id)
      .single();
    const jlptLevel = (profileResult.data?.jlpt_level ?? 'N5') as JLPTLevel;

    // Practice mode (no topic) vs Topic mode
    if (!topic_id) {
      // Free Practice mode
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          topic_id: null,
          title: 'Free Practice',
          status: 'active',
          ai_role: 'Japanese conversation partner',
          context_details: {},
        })
        .select('id')
        .single();

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }

      // Greeting: ask what the user wants to talk about
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: 'こんにちは！今日は何について話しましょうか？仕事、趣味、旅行、何でもいいですよ。',
        translation: 'Xin chào! Hôm nay chúng ta nói về chủ đề gì nhỉ? Công việc, sở thích, du lịch, gì cũng được nhé.',
      });

      return NextResponse.json({ id: conversation.id });
    }

    // Topic mode — fetch topic and generate context
    const topicResult = await supabase
      .from('topics')
      .select('*')
      .eq('id', topic_id)
      .single();

    if (topicResult.error || !topicResult.data) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const topic = topicResult.data;

    // Generate context using AI
    const contextPrompt = buildContextGenerationPrompt(
      topic.context_generation_prompt,
      jlptLevel
    );

    const contextResponse = await chatCompletion(
      [{ role: 'user', content: contextPrompt }]
    );

    let context: {
      ai_role: string;
      scenario: string;
      greeting: string;
      greeting_translation: string;
      useful_expressions: { ja: string; vi: string }[];
    };
    try {
      const parsed = parseJsonResponse(contextResponse.content);
      context = {
        ai_role: (parsed.ai_role as string) || 'Japanese colleague',
        scenario: (parsed.scenario as string) || topic.description,
        greeting: (parsed.greeting as string) || 'こんにちは！よろしくお願いします。',
        greeting_translation: (parsed.greeting_translation as string) || '',
        useful_expressions: Array.isArray(parsed.useful_expressions) ? parsed.useful_expressions as { ja: string; vi: string }[] : [],
      };
    } catch {
      context = {
        ai_role: 'Japanese colleague',
        scenario: topic.description,
        greeting: 'こんにちは！よろしくお願いします。',
        greeting_translation: 'Xin chào! Rất vui được làm việc cùng bạn.',
        useful_expressions: [],
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
        context_details: { scenario: context.scenario, useful_expressions: context.useful_expressions },
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
