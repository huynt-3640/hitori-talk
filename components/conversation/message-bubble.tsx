'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CorrectionCard } from './correction-card';

interface MessageBubbleProps {
  role: string;
  content: string;
  corrections?: unknown[] | null;
  translation?: string | null;
  createdAt?: string;
  aiName?: string;
  onSpeak?: (text: string) => void;
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function MessageBubble({
  role,
  content,
  corrections,
  translation,
  createdAt,
  aiName,
  onSpeak,
}: MessageBubbleProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const isUser = role === 'user';

  return (
    <div className={cn('flex max-w-[85%] flex-col gap-2 md:max-w-[75%]', isUser ? 'self-end' : 'self-start')}>
      {/* Corrections (before AI bubble, matching design) */}
      {!isUser && corrections && Array.isArray(corrections) && corrections.length > 0 && (
        <CorrectionCard corrections={corrections as { original: string; corrected: string; explanation: string; type: string }[]} />
      )}

      {/* Bubble */}
      <div
        className={cn(
          'rounded-2xl px-4 py-3 text-[15px] leading-relaxed md:px-5 md:py-4 md:text-base md:leading-[1.7]',
          isUser
            ? 'rounded-br-lg bg-primary text-white shadow-[0_2px_12px_rgba(124,58,237,0.4)]'
            : 'glass-card rounded-bl-lg'
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>

      {/* Translation */}
      {!isUser && translation && (
        <>
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="self-start text-xs text-primary-light hover:underline"
          >
            {showTranslation ? 'Hide translation' : 'Show translation'}
          </button>
          {showTranslation && (
            <div className="rounded-lg border-l-2 border-primary-soft bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-foreground-secondary">
              {translation}
            </div>
          )}
        </>
      )}

      {/* Meta: timestamp + speaker button */}
      <div className={cn('flex items-center gap-2 px-1', isUser ? 'justify-end' : 'justify-start')}>
        <span className="text-xs text-foreground-secondary">
          {isUser ? 'You' : aiName ?? 'AI'} · {formatTime(createdAt)}
        </span>
        {!isUser && onSpeak && (
          <button
            onClick={() => onSpeak(content)}
            className="text-xs text-foreground-secondary transition-colors hover:text-primary-light"
            title="Listen"
          >
            🔊
          </button>
        )}
      </div>
    </div>
  );
}
