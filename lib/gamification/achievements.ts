import { SupabaseClient } from '@supabase/supabase-js';

interface AchievementStats {
  totalXP: number;
  level: number;
  currentStreak: number;
  totalConversations: number;
  totalMessages: number;
  perfectConversation: boolean;
  conversationTopicId: string | null;
}

interface Achievement {
  id: string;
  name: string;
  name_ja: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
}

interface NewAchievement {
  id: string;
  name: string;
  name_ja: string;
  icon: string;
  xp_reward: number;
}

export async function checkAchievements(
  supabase: SupabaseClient,
  userId: string,
  stats: AchievementStats
): Promise<NewAchievement[]> {
  // Get all achievements
  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('*');

  if (!allAchievements || allAchievements.length === 0) return [];

  // Get already earned achievements
  const { data: earnedAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
    .not('earned_at', 'is', null);

  const earnedIds = new Set(earnedAchievements?.map((a) => a.achievement_id) ?? []);

  // Check which new achievements are earned
  const newlyEarned: NewAchievement[] = [];

  for (const achievement of allAchievements as Achievement[]) {
    if (earnedIds.has(achievement.id)) continue;

    const earned = await isAchievementEarned(supabase, userId, achievement, stats);
    if (earned) {
      // Upsert user_achievement
      await supabase.from('user_achievements').upsert(
        {
          user_id: userId,
          achievement_id: achievement.id,
          earned_at: new Date().toISOString(),
          progress: achievement.condition_value,
        },
        { onConflict: 'user_id,achievement_id' }
      );

      // Award XP bonus
      if (achievement.xp_reward > 0) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('total_xp')
          .eq('id', userId)
          .single();
        if (currentProfile) {
          await supabase
            .from('profiles')
            .update({ total_xp: currentProfile.total_xp + achievement.xp_reward })
            .eq('id', userId);
        }
      }

      newlyEarned.push({
        id: achievement.id,
        name: achievement.name,
        name_ja: achievement.name_ja,
        icon: achievement.icon,
        xp_reward: achievement.xp_reward,
      });
    } else {
      // Update progress for unearned achievements
      const progress = getProgress(stats, achievement);
      if (progress > 0) {
        await supabase.from('user_achievements').upsert(
          {
            user_id: userId,
            achievement_id: achievement.id,
            progress,
          },
          { onConflict: 'user_id,achievement_id' }
        );
      }
    }
  }

  return newlyEarned;
}

async function isAchievementEarned(
  supabase: SupabaseClient,
  userId: string,
  achievement: Achievement,
  stats: AchievementStats
): Promise<boolean> {
  switch (achievement.condition_type) {
    case 'conversations':
      return stats.totalConversations >= achievement.condition_value;
    case 'messages':
      return stats.totalMessages >= achievement.condition_value;
    case 'streak':
      return stats.currentStreak >= achievement.condition_value;
    case 'xp':
      return stats.totalXP >= achievement.condition_value;
    case 'level':
      return stats.level >= achievement.condition_value;
    case 'perfect_conversation':
      return stats.perfectConversation;
    case 'unique_topics': {
      const { data: topicData } = await supabase
        .from('conversations')
        .select('topic_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('topic_id', 'is', null);
      const uniqueTopics = new Set(topicData?.map((c) => c.topic_id)).size;
      return uniqueTopics >= achievement.condition_value;
    }
    default:
      return false;
  }
}

function getProgress(stats: AchievementStats, achievement: Achievement): number {
  switch (achievement.condition_type) {
    case 'conversations':
      return Math.min(stats.totalConversations, achievement.condition_value);
    case 'messages':
      return Math.min(stats.totalMessages, achievement.condition_value);
    case 'streak':
      return Math.min(stats.currentStreak, achievement.condition_value);
    case 'xp':
      return Math.min(stats.totalXP, achievement.condition_value);
    case 'level':
      return Math.min(stats.level, achievement.condition_value);
    default:
      return 0;
  }
}
