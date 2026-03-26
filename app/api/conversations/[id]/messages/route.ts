import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatCompletion } from '@/lib/ai/chat';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import type { JLPTLevel } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, title, ai_role, context_details, topic_id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('id, role, content, corrections, translation, created_at')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      conversation,
      messages: messages ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Fetch conversation + profile
    const [convResult, profileResult] = await Promise.all([
      supabase
        .from('conversations')
        .select('id, title, ai_role, context_details, topic_id')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single(),
      supabase.from('profiles').select('jlpt_level').eq('id', user.id).single(),
    ]);

    if (!convResult.data) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = convResult.data;
    const jlptLevel = (profileResult.data?.jlpt_level ?? 'N5') as JLPTLevel;
    const contextDetails = conversation.context_details as { scenario?: string } | null;

    // Insert user message
    await supabase.from('messages').insert({
      conversation_id: params.id,
      role: 'user',
      content: content.trim(),
    });

    // Fetch conversation history
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true });

    // Build AI prompt
    const systemPrompt = buildSystemPrompt({
      jlptLevel,
      topicTitle: conversation.title,
      contextPrompt: contextDetails?.scenario ?? '',
      aiRole: conversation.ai_role,
    });

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Call AI (Gemini → OpenRouter fallback)
    const aiResponse = await chatCompletion(messages);
    const rawContent = aiResponse.content;

    // Parse AI response - free models often wrap JSON in markdown code blocks
    let response: string;
    let corrections: unknown[] | null = null;
    let translation: string | null = null;

    try {
      // Strip markdown code block wrappers (```json ... ``` or ``` ... ```)
      const jsonStr = rawContent
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(jsonStr);
      response = parsed.response || rawContent;
      corrections = parsed.corrections || null;
      translation = parsed.translation || null;
    } catch {
      // AI didn't return valid JSON, use raw content
      response = rawContent;
    }

    // Ensure response is never empty
    if (!response.trim()) {
      response = 'すみません、もう一度お願いします。';
    }

    // Insert AI message
    const { data: aiMessage } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.id,
        role: 'assistant',
        content: response,
        corrections: corrections ? JSON.parse(JSON.stringify(corrections)) : null,
        translation,
        token_count: aiResponse.usage.total_tokens ?? null,
      })
      .select('id, role, content, corrections, translation, created_at')
      .single();

    // Update conversation message count
    await supabase
      .from('conversations')
      .update({ message_count: (history?.length ?? 0) + 1 })
      .eq('id', params.id);

    return NextResponse.json({
      message: aiMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
