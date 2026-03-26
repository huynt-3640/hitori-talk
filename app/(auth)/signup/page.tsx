'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const FEATURES = [
  { icon: '🎯', text: 'IT-focused topics: standups, code reviews, meetings' },
  { icon: '🤖', text: 'AI corrects grammar and vocabulary in real-time' },
  { icon: '📈', text: 'Track progress with XP, streaks, and achievements' },
];

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="relative z-10 flex w-full flex-col items-center justify-center md:flex-row">
      {/* Left: Brand Panel (desktop only) */}
      <div className="hidden flex-1 flex-col items-center justify-center p-16 md:flex">
        <div className="max-w-[480px] text-center">
          <div className="mb-8 text-7xl">🗣️</div>
          <h1 className="text-4xl font-bold leading-tight text-foreground">
            Master Japanese Conversation for IT Professionals
          </h1>
          <p className="mt-4 text-lg text-foreground-secondary">
            Practice real workplace scenarios with AI. Get instant corrections and build confidence.
          </p>
          <div className="mt-10 flex flex-col gap-4 text-left">
            {FEATURES.map((f) => (
              <div key={f.icon} className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3">
                <span className="shrink-0 text-2xl">{f.icon}</span>
                <span className="text-base text-foreground-secondary">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: Logo */}
      <div className="flex flex-col items-center pb-8 pt-16 md:hidden">
        <div className="text-6xl">🗣️</div>
        <p className="mt-2 text-sm text-foreground-secondary">
          Start your Japanese journey
        </p>
      </div>

      {/* Right: Auth Card */}
      <div className="flex w-full items-center justify-center px-5 md:w-[520px] md:shrink-0 md:p-12">
        <div className="glass-card-strong w-full max-w-md rounded-2xl p-6 md:p-10">
          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-[rgba(255,255,255,0.04)] p-[3px]">
            <Link
              href="/login"
              className="flex-1 rounded-lg px-4 py-3 text-center text-sm font-semibold text-foreground-secondary transition-colors hover:text-foreground"
            >
              Log In
            </Link>
            <div className="flex-1 rounded-lg bg-primary-soft px-4 py-3 text-center text-sm font-semibold text-primary-light">
              Sign Up
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground-secondary">Display Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="rounded-xl border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[15px] text-foreground placeholder:text-[rgba(241,241,247,0.5)] transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] focus:outline-none md:text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground-secondary">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[15px] text-foreground placeholder:text-[rgba(241,241,247,0.5)] transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] focus:outline-none md:text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground-secondary">Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-xl border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[15px] text-foreground placeholder:text-[rgba(241,241,247,0.5)] transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] focus:outline-none md:text-base"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-gradient rounded-xl px-4 py-4 text-[15px] font-semibold disabled:opacity-50 md:text-base"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-glass-border" />
            <span className="text-xs text-foreground-secondary">or</span>
            <div className="h-px flex-1 bg-glass-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-[15px] font-semibold text-foreground transition-all hover:border-glass-border-strong hover:bg-glass-hover md:text-base"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs text-foreground-secondary">
            By continuing, you agree to our{' '}
            <span className="text-primary-light">Terms</span> and{' '}
            <span className="text-primary-light">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
