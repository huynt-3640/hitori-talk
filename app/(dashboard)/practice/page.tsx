'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PracticeSession {
  id: string;
  created_at: string;
  message_count: number;
  xp_earned: number;
  status: string;
}

export default function PracticePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('conversations')
        .select('id, created_at, message_count, xp_earned, status')
        .eq('user_id', user.id)
        .is('topic_id', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setSessions(data);
    }
    load();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-var(--bottom-nav-height))] flex-col p-5 md:min-h-screen md:p-10 md:pl-12">
      {/* Hero */}
      <div className="mx-auto flex max-w-[600px] flex-col items-center gap-6 pt-8 text-center md:pt-16">
        <div className="glass-card rounded-3xl p-8 text-[72px]">🎤</div>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-foreground md:text-[42px] md:leading-tight">
            Free Practice
          </h1>
          <p className="text-lg leading-relaxed text-foreground-secondary md:text-xl">
            Practice Japanese conversation on any topic you want
          </p>
        </div>

        <div className="glass-card flex flex-col gap-3 rounded-2xl p-5 text-left md:p-6">
          <div className="flex items-start gap-3">
            <span className="shrink-0 text-lg">💬</span>
            <p className="text-sm leading-relaxed text-foreground-secondary md:text-base">
              Tell AI what you want to talk about — work, hobbies, travel, or anything else
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 text-lg">✏️</span>
            <p className="text-sm leading-relaxed text-foreground-secondary md:text-base">
              AI will correct your mistakes and provide Vietnamese translations
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 text-lg">🎯</span>
            <p className="text-sm leading-relaxed text-foreground-secondary md:text-base">
              Earn XP and maintain your daily streak
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/conversation/new?practice=true')}
          className="btn-primary-gradient w-full max-w-[320px] rounded-xl px-8 py-4 text-lg font-semibold md:px-10"
        >
          🎤 Start Conversation
        </button>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="mx-auto mt-10 w-full max-w-[600px]">
          <h3 className="mb-4 text-lg font-bold text-foreground md:text-xl">Recent Practice</h3>
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/conversation/${s.id}`)}
                className="glass-card flex items-center gap-3 rounded-xl p-4 text-left transition-all hover:border-glass-border-strong hover:bg-glass-hover md:gap-4 md:px-5 md:py-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground md:text-base">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {', '}
                    {new Date(s.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-secondary md:text-sm">
                    {s.message_count} messages · {s.status === 'active' ? 'In progress' : 'Completed'}
                  </p>
                </div>
                <span className="text-sm font-bold text-xp md:text-base">+{s.xp_earned} XP</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
