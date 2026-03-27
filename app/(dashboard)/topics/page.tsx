'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { TopicCard } from '@/components/dashboard/topic-card';
import { useTranslation } from '@/lib/i18n/context';

interface Topic {
  id: string;
  title: string;
  title_ja: string;
  description: string;
  category: string;
  icon: string;
  is_active: boolean;
}

const CATEGORIES = ['All', 'Work', 'Technical', 'Business', 'Casual'];

export default function TopicsPage() {
  const { t } = useTranslation();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopics() {
      const res = await fetch('/api/topics');
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      }
      setLoading(false);
    }
    fetchTopics();
  }, []);

  const filtered = useMemo(() => {
    return topics.filter((tp) => {
      const matchesCategory = activeCategory === 'All' || tp.category === activeCategory;
      const matchesSearch =
        !search ||
        tp.title.toLowerCase().includes(search.toLowerCase()) ||
        tp.title_ja.includes(search) ||
        tp.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [topics, activeCategory, search]);

  const categoryLabels: Record<string, string> = {
    All: t('topics.all'),
  };

  return (
    <div className="p-5 md:p-10 md:pl-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-foreground md:text-[42px]">{t('topics.title')}</h1>
          <p className="mt-1 text-[13px] text-foreground-secondary md:text-lg">
            {t('topics.subtitle')}
          </p>
        </div>

        {/* Search */}
        <div className="glass-card flex items-center gap-2 rounded-xl px-4 py-3 md:w-80">
          <span className="text-base text-foreground-secondary">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('topics.searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-secondary md:text-base"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mt-4 flex gap-2 overflow-x-auto md:mt-6 md:gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all md:px-5 md:text-base',
              activeCategory === cat
                ? 'border-primary bg-primary-soft text-primary-light'
                : 'border-glass-border bg-glass text-foreground-secondary hover:bg-glass-hover'
            )}
          >
            {categoryLabels[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Topic Grid */}
      <div className="mt-5 grid grid-cols-2 gap-4 md:mt-8 md:grid-cols-4 md:gap-5">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card h-40 animate-pulse rounded-2xl md:h-52" />
            ))
          : filtered.map((topic) => (
              <TopicCard
                key={topic.id}
                id={topic.id}
                title={topic.title}
                titleJa={topic.title_ja}
                description={topic.description}
                category={topic.category}
                icon={topic.icon}
              />
            ))}

        {/* Create Custom Topic */}
        <Link
          href="/topics/create"
          className="glass-card flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border-dashed border-glass-border-strong p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-glass-hover md:min-h-[200px] md:p-5"
        >
          <span className="text-[28px] opacity-50">➕</span>
          <span className="text-sm font-semibold text-foreground-secondary md:text-base">
            {t('topics.createCustom')}
          </span>
        </Link>
      </div>

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">🔍</span>
          <p className="text-lg font-semibold text-foreground">{t('topics.noTopicsFound')}</p>
          <p className="text-sm text-foreground-secondary">
            {t('topics.noTopicsHint')}
          </p>
        </div>
      )}
    </div>
  );
}
