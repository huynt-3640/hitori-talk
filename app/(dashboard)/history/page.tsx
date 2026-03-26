'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Conversation {
  id: string;
  title: string;
  ai_role: string;
  created_at: string;
  message_count: number;
  xp_earned: number;
  topics: { icon: string; category: string } | null;
}

const FILTERS = ['All', 'Work', 'Technical', 'Business', 'Casual'];

export default function HistoryPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('conversations')
        .select('id, title, ai_role, created_at, message_count, xp_earned, topics(icon, category)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setConversations(data as Conversation[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'All') return conversations;
    return conversations.filter((c) => c.topics?.category === filter);
  }, [conversations, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; items: Conversation[] }[] = [];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let currentLabel = '';
    for (const conv of filtered) {
      const dateStr = new Date(conv.created_at).toDateString();
      let label: string;
      if (dateStr === today) label = 'Today';
      else if (dateStr === yesterday) label = 'Yesterday';
      else label = new Date(conv.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      if (label !== currentLabel) {
        groups.push({ label, items: [] });
        currentLabel = label;
      }
      groups[groups.length - 1].items.push(conv);
    }
    return groups;
  }, [filtered]);

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
        <h1 className="text-lg font-semibold text-foreground">Conversation History</h1>
      </div>

      <div className="mx-auto mt-5 flex max-w-2xl flex-col gap-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all',
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card h-20 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">📝</span>
            <p className="text-lg font-semibold text-foreground">No conversations yet</p>
            <p className="text-sm text-foreground-secondary">Start a conversation to see it here</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              <p className="py-2 text-sm font-semibold text-foreground-secondary">{group.label}</p>
              <div className="flex flex-col gap-3">
                {group.items.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/conversation/${conv.id}`}
                    className="glass-card flex gap-3 rounded-xl p-4 transition-all hover:bg-glass-hover"
                  >
                    <span className="shrink-0 pt-0.5 text-[28px]">{conv.topics?.icon ?? '💬'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-foreground">{conv.title}</p>
                      <p className="mt-0.5 text-xs text-foreground-secondary">{conv.ai_role}</p>
                      <div className="mt-2 flex gap-3 text-xs text-foreground-secondary">
                        <span><span className="font-semibold text-foreground">{conv.message_count}</span> messages</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-sm font-bold text-xp">+{conv.xp_earned}</span>
                      <span className="text-xs text-foreground-secondary">
                        {new Date(conv.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
