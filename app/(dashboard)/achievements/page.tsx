'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_value: number;
  category: string;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string | null;
  progress: number;
  achievements: Achievement;
}

export default function AchievementsPage() {
  const router = useRouter();
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [{ data: ua }, { data: allA }] = await Promise.all([
        supabase
          .from('user_achievements')
          .select('achievement_id, earned_at, progress, achievements(*)')
          .order('earned_at', { ascending: false }),
        supabase.from('achievements').select('*'),
      ]);

      if (ua) setUserAchievements(ua as unknown as UserAchievement[]);
      if (allA) setAllAchievements(allA);
      setLoading(false);
    }
    load();
  }, []);

  const earned = userAchievements.filter((ua) => ua.earned_at);
  const inProgress = userAchievements.filter((ua) => !ua.earned_at && ua.progress > 0);
  const earnedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
  const locked = allAchievements.filter((a) => !earnedIds.has(a.id));
  const totalCount = allAchievements.length || 1;

  return (
    <div className="p-5 md:p-10 md:pl-12">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="glass-card flex h-9 w-9 items-center justify-center rounded-lg text-foreground"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold text-foreground">Achievements</h1>
        <span className="ml-auto text-sm text-foreground-secondary">{earned.length}/{totalCount}</span>
      </div>

      <div className="mx-auto mt-5 flex max-w-2xl flex-col gap-5">
        {/* Progress Summary */}
        <div className="glass-card flex items-center gap-4 rounded-2xl p-4">
          <span className="text-4xl">🏆</span>
          <div className="flex-1">
            <p className="text-sm text-foreground-secondary">Achievements Earned</p>
            <p className="text-xl font-bold text-foreground">{earned.length} of {totalCount}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light"
                style={{ width: `${(earned.length / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card h-36 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Earned */}
            {earned.length > 0 && (
              <Section title="Earned">
                {earned.map((ua) => (
                  <AchievementCard
                    key={ua.achievement_id}
                    icon={ua.achievements.icon}
                    name={ua.achievements.name}
                    description={ua.achievements.description}
                    state="earned"
                    date={ua.earned_at ? formatRelative(ua.earned_at) : undefined}
                  />
                ))}
              </Section>
            )}

            {/* In Progress */}
            {inProgress.length > 0 && (
              <Section title="In Progress">
                {inProgress.map((ua) => (
                  <AchievementCard
                    key={ua.achievement_id}
                    icon={ua.achievements.icon}
                    name={ua.achievements.name}
                    description={ua.achievements.description}
                    state="progress"
                    progress={ua.progress}
                    total={ua.achievements.condition_value}
                  />
                ))}
              </Section>
            )}

            {/* Locked */}
            {locked.length > 0 && (
              <Section title="Locked">
                {locked.map((a) => (
                  <AchievementCard
                    key={a.id}
                    icon="🔒"
                    name={a.name}
                    description={a.description}
                    state="locked"
                  />
                ))}
              </Section>
            )}

            {/* Empty state if no achievements exist */}
            {allAchievements.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-3 text-center">
                <span className="text-5xl">🏆</span>
                <p className="text-lg font-semibold text-foreground">No achievements yet</p>
                <p className="text-sm text-foreground-secondary">Keep practicing to unlock achievements</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function AchievementCard({
  icon,
  name,
  description,
  state,
  date,
  progress,
  total,
}: {
  icon: string;
  name: string;
  description: string;
  state: 'earned' | 'progress' | 'locked';
  date?: string;
  progress?: number;
  total?: number;
}) {
  return (
    <div
      className={`glass-card flex flex-col items-center gap-2 rounded-xl p-4 text-center ${
        state === 'locked' ? 'opacity-40' : ''
      } ${state === 'earned' ? 'border-primary bg-[rgba(124,58,237,0.08)]' : ''}`}
    >
      <span className="text-4xl">{icon}</span>
      <span className="text-sm font-semibold text-foreground">{name}</span>
      <span className="text-xs leading-relaxed text-foreground-secondary">{description}</span>
      {state === 'earned' && date && (
        <span className="text-[10px] font-medium text-primary-light">{date}</span>
      )}
      {state === 'progress' && progress !== undefined && total !== undefined && (
        <>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-foreground-secondary">{progress}/{total}</span>
        </>
      )}
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
