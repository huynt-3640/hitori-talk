import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const { data, error } = await supabase
    .from('topics')
    .insert({
      title,
      title_ja: title,
      icon: icon || '💬',
      category: category || 'Work',
      description,
      context_generation_prompt: `You are in a ${category || 'Work'} scenario: ${description}. ${ai_role ? `Your role is ${ai_role}.` : 'Choose an appropriate role for this scenario.'}`,
      is_active: true,
      sort_order: 999,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
