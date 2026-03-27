import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateConversationXP, getLevelFromXP } from '@/lib/gamification/xp';
import { checkAchievements } from '@/lib/gamification/achievements';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const elapsedSeconds: number = body.elapsed_seconds ?? 0;
    const practiceMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    // Verify conversation exists, belongs to user, and is active
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id, status')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    if (conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (conversation.status !== 'active') {
      return NextResponse.json({ error: 'Conversation already ended' }, { status: 400 });
    }

    // Count user messages and corrections
    const { data: messagesData } = await supabase
      .from('messages')
      .select('role, corrections')
      .eq('conversation_id', conversationId);

    const userMessageCount = messagesData?.filter((m) => m.role === 'user').length ?? 0;
    const totalMessageCount = messagesData?.length ?? 0;
    const correctionsCount = messagesData?.filter(
      (m) => m.role === 'assistant' && m.corrections && Array.isArray(m.corrections) && (m.corrections as unknown[]).length > 0
    ).length ?? 0;
    const mistakesCount = messagesData?.reduce((sum, m) => {
      if (m.role === 'assistant' && m.corrections && Array.isArray(m.corrections)) {
        return sum + (m.corrections as unknown[]).length;
      }
      return sum;
    }, 0) ?? 0;

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp, current_streak, longest_streak, total_conversations, total_messages, level')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Calculate XP
    const xpEarned = calculateConversationXP(userMessageCount, correctionsCount, profile.current_streak);
    const newTotalXP = profile.total_xp + xpEarned;
    const newLevel = getLevelFromXP(newTotalXP);
    const levelUp = newLevel > profile.level;

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        xp_earned: xpEarned,
        message_count: totalMessageCount,
      })
      .eq('id', conversationId);

    // Update daily_stats (upsert for today)
    const today = new Date().toISOString().split('T')[0];
    const { data: existingStats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (existingStats) {
      await supabase
        .from('daily_stats')
        .update({
          xp_earned: existingStats.xp_earned + xpEarned,
          conversations_count: existingStats.conversations_count + 1,
          messages_count: existingStats.messages_count + userMessageCount,
          practice_minutes: existingStats.practice_minutes + practiceMinutes,
          corrections_applied: existingStats.corrections_applied + correctionsCount,
          mistakes_count: existingStats.mistakes_count + mistakesCount,
        })
        .eq('id', existingStats.id);
    } else {
      await supabase.from('daily_stats').insert({
        user_id: user.id,
        date: today,
        xp_earned: xpEarned,
        conversations_count: 1,
        messages_count: userMessageCount,
        practice_minutes: practiceMinutes,
        corrections_applied: correctionsCount,
        mistakes_count: mistakesCount,
      });
    }

    // Streak calculation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: yesterdayStats } = await supabase
      .from('daily_stats')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', yesterdayStr)
      .single();

    let newStreak = profile.current_streak;
    // Only update streak if this is the first conversation today
    if (!existingStats) {
      newStreak = yesterdayStats ? profile.current_streak + 1 : 1;
    }
    const newLongestStreak = Math.max(profile.longest_streak, newStreak);

    // Update profile
    await supabase
      .from('profiles')
      .update({
        total_xp: newTotalXP,
        level: newLevel,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        total_conversations: profile.total_conversations + 1,
        total_messages: profile.total_messages + userMessageCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Check achievements
    const newAchievements = await checkAchievements(supabase, user.id, {
      totalXP: newTotalXP,
      level: newLevel,
      currentStreak: newStreak,
      totalConversations: profile.total_conversations + 1,
      totalMessages: profile.total_messages + userMessageCount,
      perfectConversation: mistakesCount === 0 && userMessageCount >= 3,
      conversationTopicId: null, // We'll handle unique_topics inside checkAchievements
    });

    return NextResponse.json({
      xp_earned: xpEarned,
      total_xp: newTotalXP,
      level: newLevel,
      level_up: levelUp,
      previous_level: profile.level,
      streak: newStreak,
      new_achievements: newAchievements,
    });
  } catch (error) {
    console.error('End conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
