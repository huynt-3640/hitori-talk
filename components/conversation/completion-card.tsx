'use client';

import { useRouter } from 'next/navigation';

interface NewAchievement {
  id: string;
  name: string;
  name_ja: string;
  icon: string;
  xp_reward: number;
}

interface CompletionCardProps {
  xpEarned: number;
  totalXP: number;
  level: number;
  levelUp: boolean;
  previousLevel: number;
  streak: number;
  newAchievements: NewAchievement[];
}

export function CompletionCard({
  xpEarned,
  totalXP,
  level,
  levelUp,
  previousLevel,
  streak,
  newAchievements,
}: CompletionCardProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <div className="glass-card overflow-hidden rounded-2xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mb-3 text-5xl">{levelUp ? '🎉' : '✨'}</div>
            <h2 className="text-2xl font-bold text-foreground">
              {levelUp ? 'Level Up!' : 'Great Practice!'}
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              お疲れ様でした！
            </p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[rgba(255,255,255,0.05)] p-4 text-center">
              <div className="text-2xl font-bold text-xp">+{xpEarned}</div>
              <div className="mt-1 text-xs text-foreground-secondary">XP Earned</div>
            </div>
            <div className="rounded-xl bg-[rgba(255,255,255,0.05)] p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{totalXP.toLocaleString()}</div>
              <div className="mt-1 text-xs text-foreground-secondary">Total XP</div>
            </div>
            <div className="rounded-xl bg-[rgba(255,255,255,0.05)] p-4 text-center">
              <div className="text-2xl font-bold text-primary-light">
                {levelUp ? (
                  <span>
                    {previousLevel} → {level}
                  </span>
                ) : (
                  level
                )}
              </div>
              <div className="mt-1 text-xs text-foreground-secondary">
                {levelUp ? 'Level Up!' : 'Level'}
              </div>
            </div>
            <div className="rounded-xl bg-[rgba(255,255,255,0.05)] p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                🔥 {streak}
              </div>
              <div className="mt-1 text-xs text-foreground-secondary">Day Streak</div>
            </div>
          </div>

          {/* New Achievements */}
          {newAchievements.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 text-center text-sm font-semibold text-foreground-secondary">
                🏆 New Achievements
              </p>
              <div className="flex flex-col gap-2">
                {newAchievements.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl bg-[rgba(124,58,237,0.15)] p-3"
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{a.name}</p>
                      <p className="text-xs text-foreground-secondary">{a.name_ja}</p>
                    </div>
                    <span className="text-sm font-bold text-xp">+{a.xp_reward} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action */}
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
