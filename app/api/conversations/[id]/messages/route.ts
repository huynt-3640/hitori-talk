import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatCompletion } from '@/lib/ai/chat';
import { buildSystemPrompt, buildPracticeSystemPrompt } from '@/lib/ai/prompts';
import { parseJsonResponse } from '@/lib/ai/parse-json-response';
import type { JLPTLevel, SupportedLanguage } from '@/types';

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
      supabase.from('profiles').select('jlpt_level, preferred_language').eq('id', user.id).single(),
    ]);

    if (!convResult.data) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = convResult.data;
    const jlptLevel = (profileResult.data?.jlpt_level ?? 'N5') as JLPTLevel;
    const lang = (profileResult.data?.preferred_language ?? 'vi') as SupportedLanguage;
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

    // Build AI prompt — use practice prompt for free conversations (no topic)
    const isPractice = !conversation.topic_id;
    const systemPrompt = isPractice
      ? buildPracticeSystemPrompt(jlptLevel, lang)
      : buildSystemPrompt({
          jlptLevel,
          topicTitle: conversation.title,
          contextPrompt: contextDetails?.scenario ?? '',
          aiRole: conversation.ai_role,
          lang,
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

    // Parse AI response - extract JSON even if mixed with plain text
    let response: string;
    let corrections: unknown[] | null = null;
    let translation: string | null = null;

    try {
      const parsed = parseJsonResponse(rawContent);
      response = (parsed.response as string) || rawContent;
      corrections = (parsed.corrections as unknown[]) || null;
      translation = (parsed.translation as string) || null;
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

    // Save corrections to mistake_log
    if (corrections && Array.isArray(corrections) && corrections.length > 0 && aiMessage) {
      const mistakeRows = corrections
        .filter((c): c is { original: string; corrected: string; explanation?: string; type?: string } =>
          typeof c === 'object' && c !== null && 'original' in c && 'corrected' in c
        )
        .map((c) => ({
          user_id: user.id,
          conversation_id: params.id,
          message_id: aiMessage.id,
          original_text: c.original,
          corrected_text: c.corrected,
          explanation: c.explanation || null,
          mistake_type: c.type || 'grammar',
        }));

      if (mistakeRows.length > 0) {
        await supabase.from('mistake_log').insert(mistakeRows);
      }
    }

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
