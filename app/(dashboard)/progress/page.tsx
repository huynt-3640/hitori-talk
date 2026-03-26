'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface DailyStat {
  date: string;
  xp_earned: number;
  conversations_count: number;
  practice_minutes: number;
  mistakes_count: number;
}

type Period = 'week' | 'month' | 'all';

export default function ProgressPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [period, setPeriod] = useState<Period>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      let query = supabase
        .from('daily_stats')
        .select('date, xp_earned, conversations_count, practice_minutes, mistakes_count')
        .order('date', { ascending: false });

      if (period === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        query = query.gte('date', weekAgo);
      } else if (period === 'month') {
        const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        query = query.gte('date', monthAgo);
      }

      const { data } = await query.limit(90);
      if (data) setStats(data);
      setLoading(false);
    }
    load();
  }, [period]);

  const totalXp = stats.reduce((sum, s) => sum + s.xp_earned, 0);
  const totalConvos = stats.reduce((sum, s) => sum + s.conversations_count, 0);
  const totalMinutes = stats.reduce((sum, s) => sum + s.practice_minutes, 0);
  const totalMistakes = stats.reduce((sum, s) => sum + s.mistakes_count, 0);
  const totalMessages = totalConvos * 5; // approximate
  const accuracy = totalMessages > 0 ? Math.round(((totalMessages - totalMistakes) / totalMessages) * 100) : 100;

  // Build chart data for last 7 days
  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const stat = stats.find((s) => s.date === dateStr);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      xp: stat?.xp_earned ?? 0,
      isToday: i === 6,
    };
  });
  const maxXp = Math.max(...chartDays.map((d) => d.xp), 1);

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
        <h1 className="text-lg font-semibold text-foreground">Progress Analytics</h1>
      </div>

      <div className="mx-auto mt-5 flex max-w-2xl flex-col gap-5">
        {/* Period Tabs */}
        <div className="flex gap-2">
          {([['week', 'This Week'], ['month', 'This Month'], ['all', 'All Time']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                period === key
                  ? 'border-primary bg-primary-soft text-primary-light'
                  : 'border-glass-border bg-glass text-foreground-secondary hover:bg-glass-hover'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card h-24 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard value={`+${totalXp}`} label="XP Earned" colorClass="text-xp" />
              <SummaryCard value={String(totalConvos)} label="Conversations" />
              <SummaryCard value={`${accuracy}%`} label="Accuracy" colorClass="text-success" />
              <SummaryCard value={`${totalMinutes}m`} label="Practice Time" />
            </div>

            {/* Chart */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="mb-4 text-base font-bold text-foreground">Daily XP</h3>
              <div className="flex items-end gap-1.5" style={{ height: 120 }}>
                {chartDays.map((day, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-full rounded-t',
                        day.isToday
                          ? 'bg-gradient-to-t from-primary to-primary-light shadow-[0_0_8px_rgba(124,58,237,0.4)]'
                          : 'bg-primary-soft'
                      )}
                      style={{ height: `${(day.xp / maxXp) * 100}%`, minHeight: day.xp > 0 ? 4 : 0 }}
                    />
                    <span className="text-[10px] text-foreground-secondary">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accuracy Breakdown */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="mb-4 text-base font-bold text-foreground">Accuracy Breakdown</h3>
              <div className="flex flex-col gap-3">
                <BreakdownRow label="Grammar" pct={82} colorClass="bg-gradient-to-r from-primary to-primary-light" />
                <BreakdownRow label="Vocabulary" pct={91} colorClass="bg-gradient-to-r from-[#10b981] to-[#34d399]" />
                <BreakdownRow label="Politeness" pct={88} colorClass="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ value, label, colorClass }: { value: string; label: string; colorClass?: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className={`text-2xl font-bold text-foreground ${colorClass ?? ''}`}>{value}</p>
      <p className="mt-1 text-xs text-foreground-secondary">{label}</p>
    </div>
  );
}

function BreakdownRow({ label, pct, colorClass }: { label: string; pct: number; colorClass: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-foreground-secondary">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]" style={{ height: 8 }}>
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right text-sm font-semibold text-foreground">{pct}%</span>
    </div>
  );
}
