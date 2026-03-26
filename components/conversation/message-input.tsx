'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  onMicPress?: () => void;
  isListening?: boolean;
  externalValue?: string;
  onExternalValueConsumed?: () => void;
}

export function MessageInput({
  onSend,
  disabled,
  onMicPress,
  isListening,
  externalValue,
  onExternalValueConsumed,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external value (from STT) into input
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== '') {
      setValue(externalValue);
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
          <button
            onClick={onMicPress}
            disabled={disabled}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-all disabled:opacity-50 md:h-12 md:w-12 md:text-[22px]',
              isListening
                ? 'animate-pulse-glow bg-destructive text-white'
                : 'btn-primary-gradient'
            )}
          >
            🎤
          </button>
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
          {isListening ? 'Listening... tap mic to stop' : 'Tap mic to speak · Alt+Enter to send'}
        </p>
      )}
    </div>
  );
}
