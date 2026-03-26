'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Mistake {
  id: string;
  original_text: string;
  corrected_text: string;
  explanation: string | null;
  mistake_type: string;
  created_at: string;
  conversations: { title: string } | null;
}

const FILTERS = ['All', 'Grammar', 'Vocabulary', 'Politeness'];
const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  grammar: { bg: 'bg-[rgba(124,58,237,0.15)]', text: 'text-primary-light' },
  vocabulary: { bg: 'bg-[rgba(16,185,129,0.15)]', text: 'text-[#34d399]' },
  politeness: { bg: 'bg-[rgba(245,158,11,0.15)]', text: 'text-[#fbbf24]' },
};

export default function MistakeLogPage() {
  const router = useRouter();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('mistake_log')
        .select('id, original_text, corrected_text, explanation, mistake_type, created_at, conversations(title)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setMistakes(data as unknown as Mistake[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'All') return mistakes;
    return mistakes.filter((m) => m.mistake_type.toLowerCase() === filter.toLowerCase());
  }, [mistakes, filter]);

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
        <h1 className="text-lg font-semibold text-foreground">Mistake Log</h1>
        <span className="ml-auto text-sm text-foreground-secondary">{mistakes.length} total</span>
      </div>

      <div className="mx-auto mt-5 flex max-w-2xl flex-col gap-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                filter === f
                  ? 'border-primary bg-primary-soft text-primary-light'
                  : 'border-glass-border bg-glass text-foreground-secondary hover:bg-glass-hover'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card h-32 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">✅</span>
            <p className="text-lg font-semibold text-foreground">No mistakes found</p>
            <p className="text-sm text-foreground-secondary">
              {filter === 'All' ? 'Great job! Keep practicing.' : `No ${filter.toLowerCase()} mistakes yet.`}
            </p>
          </div>
        ) : (
          filtered.map((mistake) => {
            const typeKey = mistake.mistake_type.toLowerCase();
            const style = TYPE_STYLES[typeKey] ?? TYPE_STYLES.grammar;

            return (
              <div key={mistake.id} className="glass-card flex flex-col gap-3 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
                    {mistake.mistake_type}
                  </span>
                  <span className="ml-auto text-xs text-foreground-secondary">
                    {mistake.conversations?.title}
                  </span>
                </div>

                {/* Correction */}
                <div className="rounded-lg border border-destructive/10 bg-destructive/5 p-3">
                  <p className="text-base text-foreground-secondary line-through">{mistake.original_text}</p>
                  <p className="mt-1 text-sm text-foreground-secondary">↓</p>
                  <p className="text-base font-medium text-success">{mistake.corrected_text}</p>
                </div>

                {/* Explanation */}
                {mistake.explanation && (
                  <p className="text-sm leading-relaxed text-foreground-secondary">{mistake.explanation}</p>
                )}

                {/* Date */}
                <p className="text-xs text-foreground-secondary">
                  {new Date(mistake.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {', '}
                  {new Date(mistake.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
