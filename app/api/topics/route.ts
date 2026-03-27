import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatCompletion } from '@/lib/ai/chat';
import { buildTopicPhrasesPrompt } from '@/lib/ai/prompts';
import { parseJsonResponse } from '@/lib/ai/parse-json-response';
import type { SupportedLanguage } from '@/types';

export async function GET() {
  const supabase = await createClient();

  const { data: topics, error } = await supabase
    .from('topics')
    .select('id, title, title_ja, description, category, icon, is_active')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(topics);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, icon, category, description, ai_role } = body;

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
  }

  const cat = category || 'Work';

  const { data, error } = await supabase
    .from('topics')
    .insert({
      title,
      title_ja: title,
      icon: icon || '💬',
      category: cat,
      description,
      context_generation_prompt: `You are in a ${cat} scenario: ${description}. ${ai_role ? `Your role is ${ai_role}.` : 'Choose an appropriate role for this scenario.'}`,
      is_active: true,
      sort_order: 999,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch user's preferred language for phrase generation
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_language')
    .eq('id', user.id)
    .single();
  const lang = (profile?.preferred_language ?? 'vi') as SupportedLanguage;

  // Generate phrases/tips via AI (non-blocking — don't fail topic creation if this fails)
  generatePhrasesForTopic(supabase, data.id, title, description, cat, lang);

  return NextResponse.json(data, { status: 201 });
}

async function generatePhrasesForTopic(
  supabase: Awaited<ReturnType<typeof createClient>>,
  topicId: string,
  title: string,
  description: string,
  category: string,
  lang: SupportedLanguage
) {
  try {
    const prompt = buildTopicPhrasesPrompt(title, description, category, lang);
    const response = await chatCompletion([{ role: 'user', content: prompt }]);
    const parsed = parseJsonResponse(response.content);

    const example_phrases = Array.isArray(parsed.example_phrases) ? parsed.example_phrases : [];
    const tips = Array.isArray(parsed.tips) ? parsed.tips : [];

    await supabase
      .from('topics')
      .update({ example_phrases, tips })
      .eq('id', topicId);
  } catch (err) {
    console.error('Failed to generate phrases for topic:', topicId, err);
  }
}
