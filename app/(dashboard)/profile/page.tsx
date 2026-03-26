'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  display_name: string;
  jlpt_level: string;
  level: number;
  total_xp: number;
  current_streak: number;
  total_conversations: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);

      const { data } = await supabase
        .from('profiles')
        .select('display_name, jlpt_level, level, total_xp, current_streak, total_conversations')
        .single();
      if (data) setProfile(data);
    }
    load();
  }, []);

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : '??';

  // XP needed for next level (simple formula: level * 250)
  const xpForNextLevel = (profile?.level ?? 1) * 250;
  const xpProgress = profile ? Math.min((profile.total_xp / xpForNextLevel) * 100, 100) : 0;

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
        <h1 className="text-lg font-semibold text-foreground">Profile</h1>
        <Link href="/profile/edit" className="ml-auto text-sm font-semibold text-primary-light">
          Edit
        </Link>
      </div>

      {/* Hero */}
      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary-soft text-[28px] font-bold text-primary-light">
          {initials}
        </div>
        <h2 className="text-2xl font-bold text-foreground">{profile?.display_name ?? '...'}</h2>
        <p className="text-sm text-foreground-secondary">{email}</p>
        <div className="flex gap-2">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-light">
            JLPT {profile?.jlpt_level ?? '...'}
          </span>
          <span className="rounded-full bg-[rgba(239,68,68,0.12)] px-3 py-1 text-xs font-semibold text-[#f87171]">
            🔥 {profile?.current_streak ?? 0} days
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-3 md:gap-4">
        <StatCard icon="⭐" value={(profile?.total_xp ?? 0).toLocaleString()} label="Total XP" colorClass="text-xp" />
        <StatCard icon="🔥" value={String(profile?.current_streak ?? 0)} label="Day Streak" colorClass="text-streak" />
        <StatCard icon="📈" value={String(profile?.level ?? 1)} label="Level" colorClass="text-level" />
        <StatCard icon="💬" value={String(profile?.total_conversations ?? 0)} label="Conversations" />
      </div>

      {/* XP Progress */}
      <div className="mx-auto mt-4 max-w-lg">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-foreground">Level {profile?.level ?? 1} Progress</span>
            <span className="text-sm text-foreground-secondary">
              {(profile?.total_xp ?? 0).toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light shadow-[0_0_12px_rgba(124,58,237,0.4)]"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mx-auto mt-5 max-w-lg">
        <div className="flex flex-col [&>*:first-child]:rounded-t-lg [&>*:last-child]:rounded-b-lg [&>*+*]:border-t-0">
          <QuickLink icon="📊" label="Progress Analytics" href="/progress" />
          <QuickLink icon="📝" label="Conversation History" href="/history" />
          <QuickLink icon="🏆" label="Achievements" href="/achievements" />
          <QuickLink icon="❌" label="Mistake Log" href="/mistakes" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, colorClass }: { icon: string; value: string; label: string; colorClass?: string }) {
  return (
    <div className="glass-card flex flex-col gap-2 rounded-xl p-4">
      <span className="text-2xl">{icon}</span>
      <span className={`text-2xl font-bold text-foreground ${colorClass ?? ''}`}>{value}</span>
      <span className="text-xs text-foreground-secondary">{label}</span>
    </div>
  );
}

function QuickLink({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border border-glass-border bg-glass px-4 py-4 transition-all hover:bg-glass-hover"
    >
      <span className="w-7 text-center text-xl">{icon}</span>
      <span className="flex-1 text-base text-foreground">{label}</span>
      <span className="text-sm text-foreground-secondary">›</span>
    </Link>
  );
}
