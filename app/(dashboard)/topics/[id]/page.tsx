'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';

interface Topic {
  id: string;
  title: string;
  title_ja: string;
  description: string;
  category: string;
  icon: string;
  example_phrases: { ja: string; vi: string }[];
  tips: string[];
}

interface ConversationSummary {
  id: string;
  created_at: string;
  xp_earned: number;
  message_count: number;
}

export default function TopicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const topicId = params.id as string;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [stats, setStats] = useState({ count: 0, totalXp: 0, avgMessages: '—', accuracy: '—' });

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: topicData } = await supabase
        .from('topics')
        .select('id, title, title_ja, description, category, icon, example_phrases, tips')
        .eq('id', topicId)
        .single();
      if (topicData) setTopic(topicData);

      const { data: convos } = await supabase
        .from('conversations')
        .select('id, created_at, xp_earned, message_count')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (convos) {
        setConversations(convos);
        const avgMsg = convos.length > 0
          ? `${Math.round(convos.reduce((s, c) => s + c.message_count, 0) / convos.length)} msg`
          : '—';
        setStats({
          count: convos.length,
          totalXp: convos.reduce((sum, c) => sum + c.xp_earned, 0),
          avgMessages: avgMsg,
          accuracy: '—',
        });
      }
    }
    load();
  }, [topicId]);

  function handleStart() {
    router.push(`/conversation/new?topic_id=${topicId}`);
  }

  if (!topic) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--bottom-nav-height))] flex-col p-5 md:min-h-screen md:p-10 md:pl-12">
      {/* Back Nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="glass-card flex h-9 w-9 items-center justify-center rounded-lg text-foreground md:h-10 md:w-10"
        >
          ←
        </button>
        <span className="hidden text-base text-foreground-secondary md:block">
          <button onClick={() => router.push('/topics')} className="text-primary-light hover:underline">{t('topics.title')}</button>
          {' / '}
          {topic.title}
        </span>
        <h1 className="text-lg font-semibold text-foreground md:hidden">{t('topicDetail.topic')}</h1>
      </div>

      {/* Two Column Layout */}
      <div className="mt-6 flex flex-col gap-8 md:mt-8 md:grid md:grid-cols-[1fr_400px] md:gap-10">
        {/* Left Column */}
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Hero */}
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-start md:gap-8 md:text-left">
            <div className="glass-card shrink-0 rounded-2xl p-6 text-[64px] md:p-8">{topic.icon}</div>
            <div className="flex flex-col gap-3 md:gap-4">
              <h2 className="text-2xl font-bold text-foreground md:text-[42px] md:leading-tight">{topic.title}</h2>
              <span className="mx-auto w-fit rounded-full bg-primary-soft px-4 py-1 text-sm font-semibold text-primary-light md:mx-0 md:text-base">
                {topic.category}
              </span>
              <p className="max-w-md text-base leading-relaxed text-foreground-secondary md:text-lg md:leading-[1.7]">
                {topic.description}
              </p>
              <button
                onClick={handleStart}
                className="btn-primary-gradient mx-auto mt-2 w-fit rounded-xl px-6 py-3 text-base font-semibold md:mx-0 md:px-10 md:py-4 md:text-lg"
              >
                ▶ {t('topicDetail.startConversation')}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <StatCard label={t('topicDetail.practiced')} value={`${stats.count}x`} />
            <StatCard label={t('topicDetail.avgMessages')} value={stats.avgMessages} />
            <StatCard label={t('topicDetail.totalXp')} value={`+${stats.totalXp}`} colorClass="text-xp" />
            <StatCard label={t('topicDetail.accuracy')} value={stats.accuracy} colorClass="text-success" />
          </div>

          {/* Example Phrases */}
          {topic.example_phrases && topic.example_phrases.length > 0 && (
            <div>
              <h3 className="mb-4 text-xl font-bold text-foreground">{t('topicDetail.examplePhrases')}</h3>
              <div className="flex flex-col gap-3">
                {topic.example_phrases.map((phrase, i) => (
                  <PhraseCard key={i} jp={phrase.ja} translation={phrase.vi} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Recent Sessions */}
          {conversations.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-bold text-foreground md:mb-4 md:text-xl">{t('topicDetail.recentSessions')}</h3>
              <div className="flex flex-col gap-3">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => router.push(`/conversation/${conv.id}`)}
                    className="glass-card flex items-center gap-3 rounded-xl p-4 text-left transition-all hover:border-glass-border-strong hover:bg-glass-hover md:gap-4 md:px-5 md:py-4"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground md:text-base">
                        {new Date(conv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {', '}
                        {new Date(conv.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-secondary md:text-sm">
                        {conv.message_count} {t('topicDetail.messages')}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-xp md:text-base">+{conv.xp_earned} XP</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tips Card */}
          {topic.tips && topic.tips.length > 0 && (
            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h3 className="mb-4 text-base font-bold text-foreground md:text-lg">💡 {t('topicDetail.tips')}</h3>
              <div className="flex flex-col">
                {topic.tips.map((tip, i) => {
                  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
                  return <TipItem key={i} emoji={emojis[i] || '💡'} text={tip} />;
                })}
              </div>
            </div>
          )}

          {/* Mobile Start Button */}
          <div className="md:hidden">
            <button
              onClick={handleStart}
              className="btn-primary-gradient w-full rounded-xl px-6 py-4 text-lg font-semibold"
            >
              ▶ {t('topicDetail.startConversation')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="glass-card flex flex-col gap-2 rounded-xl p-4 md:p-5">
      <span className="text-xs uppercase tracking-wider text-foreground-secondary md:text-sm">{label}</span>
      <span className={`text-xl font-bold text-foreground md:text-2xl ${colorClass ?? ''}`}>{value}</span>
    </div>
  );
}

function PhraseCard({ jp, translation }: { jp: string; translation: string }) {
  return (
    <div className="glass-card flex flex-col gap-2 rounded-xl p-5">
      <p className="text-lg font-semibold text-foreground">{jp}</p>
      <p className="text-base text-foreground-secondary">{translation}</p>
    </div>
  );
}

function TipItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex gap-3 border-b border-glass-border py-3 last:border-0 last:pb-0">
      <span className="shrink-0 text-lg">{emoji}</span>
      <span className="text-sm leading-relaxed text-foreground-secondary md:text-base">{text}</span>
    </div>
  );
}
