'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  onMicPress?: () => void;
  isRecording?: boolean;
  isTranscribing?: boolean;
  audioLevel?: number;
  externalValue?: string;
  onExternalValueConsumed?: () => void;
}

export function MessageInput({
  onSend,
  disabled,
  onMicPress,
  isRecording,
  isTranscribing,
  audioLevel = 0,
  externalValue,
  onExternalValueConsumed,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external value (from STT) into input — append to existing text
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== '') {
      setValue((prev) => prev + externalValue);
      onExternalValueConsumed?.();
      // Auto-resize textarea
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
          textarea.focus();
        }
      }, 0);
    }
  }, [externalValue, onExternalValueConsumed]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && e.altKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }

  // Scale the audio ring: base size 1.0, max 1.8 at full volume
  const ringScale = isRecording ? 1 + audioLevel * 0.8 : 0;

  return (
    <div className="flex flex-col gap-3 border-t border-glass-border bg-[rgba(15,15,26,0.8)] px-5 pb-5 pt-3 backdrop-blur-xl md:px-8 md:pb-6 md:pt-4">
      <div className="mx-auto flex w-full max-w-[800px] items-end gap-2 md:gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Type in Japanese..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-glass-border bg-glass px-4 py-3 text-[15px] text-foreground placeholder:text-[rgba(241,241,247,0.5)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] focus:outline-none disabled:opacity-50 md:py-4 md:text-base"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />

        {/* Mic button */}
        {onMicPress && (
          <div className="relative flex shrink-0 items-center justify-center">
            {/* Audio level ring */}
            {isRecording && (
              <div
                className="absolute inset-0 rounded-xl bg-destructive/30"
                style={{
                  transform: `scale(${ringScale})`,
                  transition: 'transform 100ms ease-out',
                }}
              />
            )}
            <button
              onClick={onMicPress}
              disabled={disabled || isTranscribing}
              className={cn(
                'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-all disabled:opacity-50 md:h-12 md:w-12 md:text-[22px]',
                isTranscribing
                  ? 'bg-glass border border-glass-border text-foreground-secondary'
                  : isRecording
                    ? 'bg-destructive text-white'
                    : 'btn-primary-gradient'
              )}
            >
              {isTranscribing ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : isRecording ? (
                <span className="block h-4 w-4 rounded-sm bg-white" />
              ) : (
                '🎤'
              )}
            </button>
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="glass-card flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-foreground transition-colors hover:bg-glass-hover disabled:opacity-30 md:h-12 md:w-12 md:text-xl"
        >
          ➤
        </button>
      </div>

      {onMicPress && (
        <p className="text-center text-[11px] text-foreground-secondary md:text-xs">
          {isTranscribing
            ? 'Transcribing...'
            : isRecording
              ? 'Recording... tap to stop'
              : 'Tap mic to speak · Alt+Enter to send'}
        </p>
      )}
    </div>
  );
}
