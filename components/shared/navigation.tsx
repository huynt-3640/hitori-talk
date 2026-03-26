'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/topics', label: 'Topics', icon: '📚' },
  { href: '/practice', label: 'Practice', icon: '🎤' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

interface NavigationProps {
  profile?: {
    display_name: string;
    jlpt_level: string;
    level: number;
  } | null;
}

export function Navigation({ profile }: NavigationProps) {
  const pathname = usePathname();

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : '??';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="glass-card sticky top-0 hidden h-screen md:flex md:w-[var(--sidebar-width)] md:shrink-0 md:flex-col" style={{ backdropFilter: 'blur(40px)' }}>
        {/* Logo */}
        <div className="flex items-center px-6 py-5">
          <Image src="/logo.png" alt="Hitori Talk" width={160} height={80} className="h-[80px] w-auto object-contain" priority />
        </div>

        {/* Nav Items */}
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all',
                  isActive
                    ? 'bg-primary-soft font-semibold text-primary-light'
                    : 'text-foreground-secondary hover:bg-glass-hover hover:text-foreground'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary-light" />
                )}
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile Card */}
        {profile && (
          <div className="p-3">
            <div className="glass-card flex items-center gap-3 rounded-xl p-3">
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-light">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {profile.display_name}
                </p>
                <p className="text-xs text-foreground-secondary">
                  JLPT {profile.jlpt_level} · Lv.{profile.level}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[var(--bottom-nav-height)] items-center justify-around border-t border-glass-border bg-[rgba(15,15,26,0.8)] backdrop-blur-xl md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-[11px] transition-colors',
                isActive ? 'text-primary-light' : 'text-foreground-secondary'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
