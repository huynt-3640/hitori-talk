'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const JLPT_LEVELS = [
  { value: 'N5', label: 'N5 - Beginner' },
  { value: 'N4', label: 'N4 - Elementary' },
  { value: 'N3', label: 'N3 - Intermediate' },
  { value: 'N2', label: 'N2 - Upper Intermediate' },
  { value: 'N1', label: 'N1 - Advanced' },
];

const DAILY_GOALS = [5, 10, 15, 30, 60];

export default function EditProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [jlptLevel, setJlptLevel] = useState('N5');
  const [dailyGoal, setDailyGoal] = useState(15);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);

      const { data } = await supabase
        .from('profiles')
        .select('display_name, jlpt_level, daily_goal')
        .single();
      if (data) {
        setDisplayName(data.display_name);
        setJlptLevel(data.jlpt_level);
        setDailyGoal(data.daily_goal);
      }
    }
    load();
  }, []);

  async function handleSave() {
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }
    setSaving(true);
    setError('');

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        jlpt_level: jlptLevel,
        daily_goal: dailyGoal,
      })
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '');

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.back();
  }

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
        <h1 className="text-lg font-semibold text-foreground">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary-gradient ml-auto rounded-lg px-4 py-1.5 text-sm font-semibold"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="mx-auto mt-6 flex max-w-lg flex-col gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-primary bg-primary-soft text-[32px] font-bold text-primary-light">
            {displayName ? displayName.slice(0, 2).toUpperCase() : '??'}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Display Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-lg border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          />
        </div>

        {/* Email (read-only) */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="rounded-lg border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-foreground-secondary outline-none"
          />
          <p className="text-xs text-foreground-secondary">Email cannot be changed</p>
        </div>

        {/* JLPT Level */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">JLPT Level</label>
          <select
            value={jlptLevel}
            onChange={(e) => setJlptLevel(e.target.value)}
            className="appearance-none rounded-lg border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          >
            {JLPT_LEVELS.map((level) => (
              <option key={level.value} value={level.value} className="bg-[#1a1a2e]">
                {level.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-foreground-secondary">
            AI will adjust conversation complexity based on your level
          </p>
        </div>

        {/* Daily Goal */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">Daily Goal (minutes)</label>
          <select
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="appearance-none rounded-lg border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          >
            {DAILY_GOALS.map((g) => (
              <option key={g} value={g} className="bg-[#1a1a2e]">
                {g} minutes
              </option>
            ))}
          </select>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-destructive/10 bg-destructive/5 p-4">
          <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
          <p className="mt-1 text-xs text-foreground-secondary">
            Once you delete your account, there is no going back. All data will be permanently removed.
          </p>
          <button className="mt-3 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
