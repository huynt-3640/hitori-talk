'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import type { SupportedLanguage } from '@/types';

interface Profile {
  display_name: string;
  jlpt_level: string;
  level: number;
  total_xp: number;
  daily_goal: number;
  preferred_language: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [autoTts, setAutoTts] = useState(true);
  const [showTranslations, setShowTranslations] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('display_name, jlpt_level, level, total_xp, daily_goal, preferred_language')
        .single();
      if (data) setProfile(data);
    }
    load();
  }, []);

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : '??';

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function handleLanguageChange(lang: SupportedLanguage) {
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ preferred_language: lang })
      .eq('id', (await supabase.auth.getUser()).data.user!.id);
    // Reload page to update LanguageProvider from server layout
    window.location.reload();
  }

  return (
    <div className="p-5 md:mx-auto md:max-w-2xl md:p-10">
      <h1 className="text-[28px] font-bold text-foreground md:text-[42px]">{t('settings.title')}</h1>

      <div className="mt-5 flex flex-col gap-5 md:mt-8">
        {/* Profile Card */}
        <Link
          href="/profile"
          className="glass-card flex items-center gap-4 rounded-xl p-5 transition-all hover:bg-glass-hover"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-primary-light">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-foreground">{profile?.display_name ?? '...'}</p>
            <p className="text-sm text-foreground-secondary">
              JLPT {profile?.jlpt_level ?? '...'} · Level {profile?.level ?? 0} · {(profile?.total_xp ?? 0).toLocaleString()} XP
            </p>
          </div>
          <span className="text-foreground-secondary">→</span>
        </Link>

        {/* Learning */}
        <SettingsGroup title={t('settings.learning')}>
          <SettingsLink icon="📖" label={t('settings.jlptLevel')} value={profile?.jlpt_level ?? '...'} href="/profile/edit" />
          <SettingsLink icon="🎯" label={t('settings.dailyGoal')} value={`${profile?.daily_goal ?? 15} min`} href="/profile/edit" />
          <SettingsToggle icon="🔊" label={t('settings.autoPlayTts')} value={autoTts} onChange={setAutoTts} />
          <SettingsToggle icon="🇻🇳" label={t('settings.showTranslations')} value={showTranslations} onChange={setShowTranslations} />
          <SettingsLanguage
            icon="🌐"
            label={t('settings.language')}
            value={(profile?.preferred_language ?? 'vi') as SupportedLanguage}
            onChange={handleLanguageChange}
          />
        </SettingsGroup>

        {/* App */}
        <SettingsGroup title={t('settings.app')}>
          <SettingsLink icon="🔒" label={t('settings.changePassword')} href="/settings/change-password" />
          <SettingsLink icon="📊" label={t('settings.progressAnalytics')} href="/progress" />
          <SettingsLink icon="🏆" label={t('settings.achievements')} href="/achievements" />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 border border-t-0 border-glass-border bg-glass px-4 py-4 text-left transition-all hover:bg-glass-hover"
          >
            <span className="w-8 text-center text-xl">🚪</span>
            <span className="flex-1 text-base text-destructive">
              {loggingOut ? t('settings.loggingOut') : t('settings.logOut')}
            </span>
            <span className="text-sm text-foreground-secondary">›</span>
          </button>
        </SettingsGroup>

        <p className="py-6 text-center text-xs text-foreground-secondary">Hitori Talk v1.0.0</p>
      </div>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
        {title}
      </p>
      <div className="flex flex-col [&>*:first-child]:rounded-t-lg [&>*:last-child]:rounded-b-lg [&>*+*]:border-t-0">
        {children}
      </div>
    </div>
  );
}

function SettingsLink({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border border-glass-border bg-glass px-4 py-4 transition-all hover:bg-glass-hover"
    >
      <span className="w-8 text-center text-xl">{icon}</span>
      <span className="flex-1 text-base text-foreground">{label}</span>
      {value && <span className="text-sm text-foreground-secondary">{value}</span>}
      <span className="text-sm text-foreground-secondary">›</span>
    </Link>
  );
}

function SettingsToggle({
  icon,
  label,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 border border-glass-border bg-glass px-4 py-4">
      <span className="w-8 text-center text-xl">{icon}</span>
      <span className="flex-1 text-base text-foreground">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-[rgba(255,255,255,0.1)]'}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );
}

const LANGUAGES: { value: SupportedLanguage; label: string; flag: string }[] = [
  { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
];

function SettingsLanguage({
  icon,
  label,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  value: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}) {
  return (
    <div className="flex items-center gap-3 border border-glass-border bg-glass px-4 py-4">
      <span className="w-8 text-center text-xl">{icon}</span>
      <span className="flex-1 text-base text-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SupportedLanguage)}
        className="rounded-lg border border-glass-border bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-sm text-foreground outline-none"
      >
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
