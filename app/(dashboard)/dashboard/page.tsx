import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TopicCard } from '@/components/dashboard/topic-card';
import { getServerTranslations } from '@/lib/i18n/server';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'おはよう！';
  if (hour < 18) return 'こんにちは！';
  return 'こんばんは！';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { t } = await getServerTranslations();

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [profileResult, topicsResult, recentResult, todayStatsResult, weekStatsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, total_xp, current_streak, level, jlpt_level, daily_goal')
      .single(),
    supabase
      .from('topics')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('conversations')
      .select('id, title, created_at, message_count, xp_earned, topic_id, topics(icon)')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('daily_stats')
      .select('practice_minutes')
      .eq('date', today)
      .single(),
    supabase
      .from('daily_stats')
      .select('conversations_count, practice_minutes, xp_earned, messages_count, mistakes_count')
      .gte('date', weekAgo),
  ]);

  const profile = profileResult.data;
  const topics = topicsResult.data;
  const recentConversations = recentResult.data;
  const todayStats = todayStatsResult.data;
  const weekStats = weekStatsResult.data;

  // Today's goal progress
  const todayMinutes = todayStats?.practice_minutes ?? 0;
  const dailyGoal = profile?.daily_goal ?? 15;
  const goalPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  // This week aggregation
  const weekConversations = weekStats?.reduce((s, d) => s + d.conversations_count, 0) ?? 0;
  const weekMinutes = weekStats?.reduce((s, d) => s + d.practice_minutes, 0) ?? 0;
  const weekXP = weekStats?.reduce((s, d) => s + d.xp_earned, 0) ?? 0;
  const weekMessages = weekStats?.reduce((s, d) => s + d.messages_count, 0) ?? 0;
  const weekMistakes = weekStats?.reduce((s, d) => s + d.mistakes_count, 0) ?? 0;
  const weekAccuracy = weekMessages > 0 ? Math.round((1 - weekMistakes / weekMessages) * 100) : null;

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : '??';

  const minutesCompletedText = t('dashboard.minutesCompleted')
    .replace('{current}', String(todayMinutes))
    .replace('{goal}', String(dailyGoal));

  return (
    <div className="p-5 md:p-10 md:pl-12">
      {/* Mobile Header with Logo */}
      <div className="mb-3 flex items-center justify-between md:hidden">
        <Image src="/logo.png" alt="Hitori Talk" width={128} height={64} className="h-16 w-auto object-contain" priority />
        <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full border border-glass-border bg-glass text-[13px] font-bold text-primary-light">
          {initials}
        </Link>
      </div>

      {/* Greeting */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-[28px] font-bold text-foreground md:text-[42px]">
          {getGreeting()}
        </h1>
        <p className="mt-1 text-[13px] text-foreground-secondary md:text-lg">
          {formatDate()}
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {/* XP */}
        <div className="glass-card rounded-xl p-4 transition-all hover:border-glass-border-strong hover:bg-glass-hover md:rounded-2xl md:p-6 md:hover:-translate-y-0.5">
          <div className="mb-3 text-[28px] md:mb-4 md:text-[32px]">⭐</div>
          <div className="text-2xl font-bold text-foreground md:text-[44px] md:leading-none">
            {(profile?.total_xp ?? 0).toLocaleString()}
          </div>
          <div className="mt-1 text-xs font-medium text-foreground-secondary md:mt-2 md:text-base">
            {t('dashboard.totalXp')}
          </div>
        </div>

        {/* Streak */}
        <div className="glass-card rounded-xl p-4 transition-all hover:border-glass-border-strong hover:bg-glass-hover md:rounded-2xl md:p-6 md:hover:-translate-y-0.5">
          <div className="mb-3 text-[28px] md:mb-4 md:text-[32px]">🔥</div>
          <div className="text-2xl font-bold text-foreground md:text-[44px] md:leading-none">
            {profile?.current_streak ?? 0} {t('dashboard.days')}
          </div>
          <div className="mt-1 text-xs font-medium text-foreground-secondary md:mt-2 md:text-base">
            {t('dashboard.currentStreak')}
          </div>
        </div>

        {/* CTA Card */}
        <div className="col-span-2 flex flex-col justify-between rounded-xl p-5 transition-all hover:-translate-y-0.5 md:row-span-2 md:rounded-2xl md:p-8" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)' }}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/60 md:text-sm">
              {t('dashboard.readyToPractice')}
            </div>
            <div className="mt-2 text-xl font-bold text-white md:mt-4 md:text-4xl">
              {t('dashboard.startConversation')}
            </div>
            <div className="mt-1 text-sm text-white/70 md:mt-3 md:max-w-[500px] md:text-lg md:leading-relaxed">
              {t('dashboard.pickTopic')}
            </div>
          </div>
          <Link
            href="/topics"
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl border border-white/25 bg-white/20 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:px-8 md:py-4 md:text-base"
          >
            ▶ {t('dashboard.startNow')}
          </Link>
        </div>

        {/* Level */}
        <div className="glass-card rounded-xl p-4 transition-all hover:border-glass-border-strong hover:bg-glass-hover md:rounded-2xl md:p-6 md:hover:-translate-y-0.5">
          <div className="mb-3 text-[28px] md:mb-4 md:text-[32px]">🎯</div>
          <div className="text-2xl font-bold text-foreground md:text-[44px] md:leading-none">
            {profile?.level ?? 1}
          </div>
          <div className="mt-1 text-xs font-medium text-foreground-secondary md:mt-2 md:text-base">
            {t('dashboard.level')}
          </div>
        </div>

        {/* JLPT */}
        <div className="glass-card rounded-xl p-4 transition-all hover:border-glass-border-strong hover:bg-glass-hover md:rounded-2xl md:p-6 md:hover:-translate-y-0.5">
          <div className="mb-3 text-[28px] md:mb-4 md:text-[32px]">📖</div>
          <div className="text-2xl font-bold text-foreground md:text-[44px] md:leading-none">
            {profile?.jlpt_level ?? 'N5'}
          </div>
          <div className="mt-1 text-xs font-medium text-foreground-secondary md:mt-2 md:text-base">
            {t('dashboard.jlptLevel')}
          </div>
        </div>

        {/* Today's Goal */}
        <div className="glass-card col-span-2 rounded-xl p-4 transition-all hover:border-glass-border-strong hover:bg-glass-hover md:rounded-2xl md:p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground md:text-lg">🎯 {t('dashboard.todaysGoal')}</span>
            <span className="text-sm font-bold text-primary-light md:text-base">{goalPercent}%</span>
          </div>
          <div className="progress-bar mt-3">
            <div className="progress-fill" style={{ width: `${goalPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-foreground-secondary md:mt-3 md:text-sm">
            {minutesCompletedText}
          </p>
        </div>

        {/* This Week (desktop only) */}
        <div className="glass-card col-span-2 hidden rounded-2xl p-6 transition-all hover:border-glass-border-strong hover:bg-glass-hover md:block">
          <p className="mb-4 text-lg font-semibold text-foreground">📊 {t('dashboard.thisWeek')}</p>
          <div className="flex flex-col gap-4">
            <WeekRow label={t('dashboard.conversations')} value={String(weekConversations)} />
            <WeekRow label={t('dashboard.practiceTime')} value={`${weekMinutes} ${t('common.minutes')}`} />
            <WeekRow label={t('dashboard.xpEarned')} value={`+${weekXP}`} valueClass="text-xp" />
            <WeekRow label={t('dashboard.accuracy')} value={weekAccuracy !== null ? `${weekAccuracy}%` : '—'} valueClass="text-success" />
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="mt-8 md:mt-10">
        <h2 className="mb-4 text-lg font-bold text-foreground md:mb-5 md:text-[22px]">
          {t('dashboard.topics')}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {topics?.map((topic) => (
            <TopicCard
              key={topic.id}
              id={topic.id}
              title={topic.title}
              titleJa={topic.title_ja}
              description={topic.description}
              category={topic.category}
              icon={topic.icon}
            />
          ))}
        </div>
      </div>

      {/* Recent Conversations */}
      {recentConversations && recentConversations.length > 0 && (
        <div className="mt-8 md:mt-10">
          <h2 className="mb-4 text-lg font-bold text-foreground md:mb-5 md:text-[22px]">
            {t('dashboard.recentConversations')}
          </h2>
          <div className="flex flex-col gap-3 md:gap-4">
            {recentConversations.map((conv) => {
              const topicData = conv.topics as { icon: string } | null;
              const timeAgo = getTimeAgo(conv.created_at);
              return (
                <Link
                  key={conv.id}
                  href={`/conversation/${conv.id}`}
                  className="glass-card flex items-center gap-3 rounded-2xl p-4 transition-all hover:border-glass-border-strong hover:bg-glass-hover md:gap-5 md:p-5 md:hover:translate-x-1"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-glass-border bg-[rgba(255,255,255,0.05)] text-lg md:h-[52px] md:w-[52px] md:rounded-2xl md:text-2xl">
                    {topicData?.icon ?? '💬'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-foreground md:text-lg">
                      {conv.title}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-secondary md:text-sm">
                      {timeAgo} · {conv.message_count} {t('dashboard.messages')}
                    </p>
                  </div>
                  <div className="shrink-0 text-sm font-bold text-xp md:text-base">
                    +{conv.xp_earned} XP
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function WeekRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-glass-border pb-4 last:border-0 last:pb-0">
      <span className="text-base text-foreground-secondary">{label}</span>
      <span className={`text-xl font-bold text-foreground ${valueClass ?? ''}`}>{value}</span>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
