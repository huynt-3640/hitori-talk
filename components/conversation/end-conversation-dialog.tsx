'use client';

import { useRouter } from 'next/navigation';

interface Correction {
  original: string;
  corrected: string;
}

interface EndConversationDialogProps {
  open: boolean;
  onClose: () => void;
  topicTitle: string;
  duration: string;
  messageCount: number;
  corrections: Correction[];
  xpEarned: number;
  accuracy: number;
}

export function EndConversationDialog({
  open,
  onClose,
  topicTitle,
  duration,
  messageCount,
  corrections,
  xpEarned,
  accuracy,
}: EndConversationDialogProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,15,26,0.85)] p-5 backdrop-blur-sm">
      <div className="glass-card-strong w-full max-w-md rounded-2xl p-6">
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="text-center">
            <p className="text-5xl">🎉</p>
            <h2 className="mt-3 text-2xl font-bold text-foreground">Great Session!</h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              You practiced for {duration} on {topicTitle}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard value={duration} label="Duration" />
            <StatCard value={String(messageCount)} label="Messages" />
            <StatCard value={String(corrections.length)} label="Corrections" colorClass="text-warning" />
            <StatCard value={`${accuracy}%`} label="Accuracy" colorClass="text-success" />
          </div>

          {/* XP Earned */}
          <div className="rounded-xl bg-primary-soft p-4 text-center">
            <p className="text-2xl font-bold text-primary-light">+{xpEarned} XP</p>
            <p className="text-sm text-primary-light/70">Experience earned</p>
          </div>

          {/* Corrections */}
          {corrections.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Corrections to review:</p>
              <div className="flex flex-col gap-2">
                {corrections.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-destructive/10 bg-destructive/5 p-3 text-sm"
                  >
                    <span className="text-foreground-secondary line-through">{c.original}</span>
                    {' → '}
                    <span className="font-medium text-success">{c.corrected}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                onClose();
                router.push(`/topics`);
              }}
              className="btn-primary-gradient w-full rounded-lg py-3.5 text-base font-semibold"
            >
              Practice Again
            </button>
            <button
              onClick={() => {
                onClose();
                router.push('/dashboard');
              }}
              className="w-full rounded-lg border border-glass-border py-3 text-sm font-medium text-foreground-secondary transition-colors hover:bg-glass-hover"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, colorClass }: { value: string; label: string; colorClass?: string }) {
  return (
    <div className="glass-card rounded-xl p-3 text-center">
      <p className={`text-xl font-bold text-foreground ${colorClass ?? ''}`}>{value}</p>
      <p className="mt-1 text-xs text-foreground-secondary">{label}</p>
    </div>
  );
}
