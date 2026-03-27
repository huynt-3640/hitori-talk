'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ONBOARDING_TEST_MESSAGES } from '@/config/constants';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { useSpeechSynthesis } from '@/lib/hooks/use-speech-synthesis';

const LEVELS = [
  { id: 'N5', name: 'Beginner', desc: 'Basic greetings, simple phrases' },
  { id: 'N4', name: 'Elementary', desc: 'Simple daily conversations' },
  { id: 'N3', name: 'Intermediate', desc: 'Everyday situations, some workplace' },
  { id: 'N2', name: 'Upper Intermediate', desc: 'Complex workplace conversations' },
  { id: 'N1', name: 'Advanced', desc: 'Nuanced business communication, formal keigo' },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  translation?: string | null;
  corrections?: Array<{ original: string; corrected: string; explanation: string; type: string }> | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [evaluatedLevel, setEvaluatedLevel] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [saving, setSaving] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TTS
  const { speak } = useSpeechSynthesis({ lang: 'ja-JP', rate: 0.9 });

  // STT
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { isRecording, audioLevel, toggleRecording } = useAudioRecorder({
    onStop: async (base64Audio) => {
      setIsTranscribing(true);
      try {
        const res = await fetch('/api/speech-to-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64Audio }),
        });
        const data = await res.json();
        if (data.text?.trim()) {
          setInput((prev) => prev + data.text.trim());
        }
      } catch (err) {
        console.error('STT error:', err);
      } finally {
        setIsTranscribing(false);
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function startTest() {
    if (!selectedLevel) return;
    setStep(2);
    setSending(true);

    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'greeting', jlpt_level: selectedLevel }),
      });
      const data = await res.json();
      const msg: ChatMessage = { role: 'assistant', content: data.response, translation: data.translation };
      setMessages([msg]);
      speak(msg.content);
    } catch {
      const msg: ChatMessage = {
        role: 'assistant',
        content: 'こんにちは！お仕事について教えてください。',
        translation: 'Xin chào! Hãy kể cho tôi về công việc của bạn.',
      };
      setMessages([msg]);
      speak(msg.content);
    } finally {
      setSending(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    const newCount = userMessageCount + 1;
    setUserMessageCount(newCount);

    // If this is the last message, skip AI reply and go straight to evaluation
    if (newCount >= ONBOARDING_TEST_MESSAGES) {
      try {
        await evaluateLevel(newMessages);
      } catch {
        setEvaluatedLevel(selectedLevel);
        setReasoning('Không thể đánh giá tự động. Sử dụng level bạn đã chọn.');
        setStep(3);
      } finally {
        setSending(false);
      }
      return;
    }

    try {
      // Send only previous messages as history, current message separately
      const previousMessages = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          jlpt_level: selectedLevel,
          message: content,
          history: previousMessages,
        }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: data.response,
        translation: data.translation,
        corrections: data.corrections,
      };
      setMessages([...newMessages, aiMsg]);
      speak(aiMsg.content);
    } catch {
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: 'すみません、もう一度お願いします。',
        translation: 'Xin lỗi, bạn nói lại được không?',
      };
      setMessages([...newMessages, aiMsg]);
      speak(aiMsg.content);
    } finally {
      setSending(false);
    }
  }

  async function evaluateLevel(allMessages: ChatMessage[]) {
    const res = await fetch('/api/onboarding/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evaluate',
        jlpt_level: selectedLevel,
        history: allMessages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) {
      throw new Error(`Evaluate failed: ${res.status}`);
    }
    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }
    setEvaluatedLevel(data.evaluated_level || selectedLevel);
    setReasoning(data.reasoning || '');
    setStep(3);
  }

  async function saveLevel(level: string) {
    setSaving(true);
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jlpt_level: level }),
      });
      router.push('/dashboard');
      router.refresh();
    } catch {
      setSaving(false);
    }
  }

  async function skipOnboarding() {
    await saveLevel('N5');
  }

  const micDisabled = sending || isTranscribing || userMessageCount >= ONBOARDING_TEST_MESSAGES;
  const ringScale = isRecording ? 1 + audioLevel * 0.8 : 0;

  return (
    <div className="relative z-10 w-full max-w-[720px] px-5 py-8 md:px-0">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Image src="/logo.png" alt="Hitori Talk" width={128} height={48} className="hidden h-12 w-auto object-contain md:block" priority />
        <div className="text-sm text-foreground-secondary md:text-base">Step {step} of 3</div>
        <button onClick={skipOnboarding} className="text-sm text-primary-light md:text-base">Skip</button>
      </div>

      {/* Progress */}
      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s < step ? 'bg-primary-light' : s === step ? 'bg-gradient-to-r from-primary to-primary-light shadow-[0_0_8px_var(--color-primary-glow)]' : 'bg-[rgba(255,255,255,0.08)]'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Level Selection */}
      {step === 1 && (
        <div className="glass-card-strong flex flex-col gap-6 rounded-2xl p-6 md:p-12">
          <div className="text-5xl">📖</div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">What&apos;s your Japanese level?</h1>
          <p className="text-base text-foreground-secondary md:text-lg">
            We&apos;ll have a short conversation to calibrate your level. You can always change this later.
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all md:p-5 ${
                  selectedLevel === level.id
                    ? 'border-primary bg-primary-soft shadow-[0_0_0_1px_var(--color-primary),0_4px_20px_var(--color-primary-glow)]'
                    : 'border-glass-border bg-glass hover:border-glass-border-strong hover:bg-glass-hover'
                } ${level.id === 'N1' ? 'md:col-span-2' : ''}`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold md:h-14 md:w-14 md:text-xl ${
                  selectedLevel === level.id
                    ? 'bg-primary text-white'
                    : 'border border-glass-border bg-glass text-primary-light'
                }`}>
                  {level.id}
                </div>
                <div className="flex-1">
                  <div className="text-base font-semibold text-foreground md:text-lg">{level.name}</div>
                  <div className="mt-0.5 text-xs text-foreground-secondary md:text-sm">{level.desc}</div>
                </div>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 md:h-7 md:w-7 ${
                  selectedLevel === level.id
                    ? 'border-primary bg-primary text-sm text-white'
                    : 'border-glass-border'
                }`}>
                  {selectedLevel === level.id && '✓'}
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={startTest}
              disabled={!selectedLevel}
              className="btn-primary-gradient rounded-xl px-8 py-4 text-base font-semibold disabled:opacity-40 disabled:shadow-none"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Conversation Test */}
      {step === 2 && (
        <div className="glass-card-strong flex flex-col rounded-2xl" style={{ height: 'calc(100vh - 160px)', maxHeight: '700px' }}>
          {/* Chat header */}
          <div className="border-b border-glass-border px-5 py-4">
            <h2 className="text-lg font-bold text-foreground">Placement Test</h2>
            <p className="text-sm text-foreground-secondary">
              {userMessageCount}/{ONBOARDING_TEST_MESSAGES} messages · JLPT {selectedLevel}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex flex-col gap-4">
              {messages.map((msg, i) => (
                <OnboardingBubble key={i} msg={msg} onSpeak={speak} />
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-glass-border bg-glass px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground-secondary [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground-secondary [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground-secondary [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-glass-border p-4">
            {userMessageCount >= ONBOARDING_TEST_MESSAGES ? (
              <div className="flex items-center justify-center gap-2 text-sm text-foreground-secondary">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Evaluating your level...
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.altKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type or speak in Japanese..."
                  disabled={sending}
                  className="flex-1 rounded-xl border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[15px] text-foreground placeholder:text-[rgba(241,241,247,0.5)] focus:border-primary focus:outline-none disabled:opacity-50"
                />

                {/* Mic button */}
                <div className="relative flex shrink-0 items-center justify-center">
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
                    onClick={toggleRecording}
                    disabled={micDisabled}
                    className={cn(
                      'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-all disabled:opacity-50',
                      isTranscribing
                        ? 'border border-glass-border bg-glass text-foreground-secondary'
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

                {/* Send button */}
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="glass-card flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-foreground transition-colors hover:bg-glass-hover disabled:opacity-30"
                >
                  ➤
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && evaluatedLevel && (
        <div className="glass-card-strong flex flex-col items-center gap-6 rounded-2xl p-6 text-center md:p-12">
          <div className="text-5xl">🎯</div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Your Recommended Level</h1>

          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-white shadow-[0_4px_20px_var(--color-primary-glow)] md:h-28 md:w-28 md:text-4xl">
            {evaluatedLevel}
          </div>

          {evaluatedLevel !== selectedLevel && (
            <p className="text-sm text-foreground-secondary md:text-base">
              You selected {selectedLevel}, but based on your conversation we recommend <strong className="text-primary-light">{evaluatedLevel}</strong>
            </p>
          )}

          <p className="max-w-md text-sm text-foreground-secondary md:text-base">{reasoning}</p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => saveLevel(evaluatedLevel)}
              disabled={saving}
              className="btn-primary-gradient rounded-xl px-8 py-4 text-base font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : `Start with ${evaluatedLevel}`}
            </button>
            {evaluatedLevel !== selectedLevel && (
              <button
                onClick={() => saveLevel(selectedLevel!)}
                disabled={saving}
                className="rounded-xl border border-glass-border bg-glass px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-glass-hover disabled:opacity-50"
              >
                Keep {selectedLevel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OnboardingBubble({ msg, onSpeak }: { msg: ChatMessage; onSpeak: (text: string) => void }) {
  const [showTranslation, setShowTranslation] = useState(false);
  const isUser = msg.role === 'user';

  return (
    <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Bubble */}
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-primary text-white'
          : 'border border-glass-border bg-glass'
      }`}>
        <p className={`text-[15px] ${isUser ? 'text-white' : 'text-foreground'}`}>
          {msg.content}
        </p>
      </div>

      {/* Translation toggle + Speaker (AI only) */}
      {!isUser && (
        <div className="flex items-center gap-2 px-1">
          {msg.translation && (
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="text-xs text-primary-light hover:underline"
            >
              {showTranslation ? 'Hide translation' : 'Show translation'}
            </button>
          )}
          <button
            onClick={() => onSpeak(msg.content)}
            className="text-xs text-foreground-secondary transition-colors hover:text-primary-light"
            title="Listen"
          >
            🔊
          </button>
        </div>
      )}

      {/* Translation content */}
      {!isUser && showTranslation && msg.translation && (
        <div className="max-w-[85%] rounded-lg border-l-2 border-primary-soft bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-foreground-secondary">
          {msg.translation}
        </div>
      )}
    </div>
  );
}
