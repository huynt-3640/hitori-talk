import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { JLPT_LEVELS } from '@/config/constants';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jlpt_level } = await request.json();

    if (!jlpt_level || !JLPT_LEVELS.includes(jlpt_level)) {
      return NextResponse.json({ error: 'Invalid JLPT level' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        jlpt_level,
        onboarding_completed: true,
      })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
