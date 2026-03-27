'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewConversationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topic_id');
  const isPractice = searchParams.get('practice') === 'true';
  const creatingRef = useRef(false);

  useEffect(() => {
    if ((!topicId && !isPractice) || creatingRef.current) return;
    creatingRef.current = true;

    async function create() {
      try {
        const body = isPractice ? {} : { topic_id: topicId };
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error('Failed to create conversation');

        const { id } = await res.json();
        router.replace(`/conversation/${id}`);
      } catch {
        router.replace(isPractice ? '/practice' : '/topics');
      }
    }

    create();
  }, [topicId, isPractice, router]);

  return (
    <div className="flex h-[calc(100vh-var(--bottom-nav-height))] flex-col items-center justify-center gap-6 md:h-screen">
      {/* Spinner */}
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-glass-border border-t-primary" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🗣️</div>
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-xl font-bold text-foreground">Preparing your conversation...</h2>
        <p className="max-w-[280px] text-sm leading-relaxed text-foreground-secondary">
          AI is setting up the scenario and choosing a character for you
        </p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-2">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
      </div>
    </div>
  );
}
