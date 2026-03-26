import Link from 'next/link';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span className="text-7xl">{emoji}</span>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="max-w-[280px] text-base leading-relaxed text-foreground-secondary">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="btn-primary-gradient mt-2 rounded-xl px-6 py-3 text-base font-semibold"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="btn-primary-gradient mt-2 rounded-xl px-6 py-3 text-base font-semibold"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface ErrorCardProps {
  emoji?: string;
  title: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorCard({ emoji = '📡', title, description, onRetry }: ErrorCardProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-destructive/15 bg-destructive/5 p-6 text-center">
      <span className="text-5xl">{emoji}</span>
      <h3 className="text-lg font-bold text-destructive">{title}</h3>
      <p className="text-sm leading-relaxed text-foreground-secondary">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-lg border border-glass-border bg-glass px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-glass-hover"
        >
          🔄 Retry
        </button>
      )}
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div className="mx-5 flex items-center gap-3 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3">
      <span className="h-2 w-2 shrink-0 rounded-full bg-warning" />
      <span className="text-sm text-warning">You&apos;re offline. Some features may be limited.</span>
    </div>
  );
}
