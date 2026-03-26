'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ONBOARDING_TEST_MESSAGES } from '@/config/constants';

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
      setMessages([{ role: 'assistant', content: data.response, translation: data.translation }]);
    } catch {
      setMessages([{
        role: 'assistant',
        content: 'こんにちは！お仕事について教えてください。',
        translation: 'Xin chào! Hãy kể cho tôi về công việc của bạn.',
      }]);
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

    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          jlpt_level: selectedLevel,
          message: content,
          history: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();

      setMessages([...newMessages, {
        role: 'assistant',
        content: data.response,
        translation: data.translation,
        corrections: data.corrections,
      }]);

      // Check if test is complete
      if (newCount >= ONBOARDING_TEST_MESSAGES) {
        await evaluateLevel([...newMessages, { role: 'assistant', content: data.response }]);
      }
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'すみません、もう一度お願いします。',
        translation: 'Xin lỗi, bạn nói lại được không?',
      }]);
    } finally {
      setSending(false);
    }
  }

  async function evaluateLevel(allMessages: ChatMessage[]) {
    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          jlpt_level: selectedLevel,
          history: allMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setEvaluatedLevel(data.evaluated_level);
      setReasoning(data.reasoning);
      setStep(3);
    } catch {
      setEvaluatedLevel(selectedLevel);
      setReasoning('Không thể đánh giá tự động. Sử dụng level bạn đã chọn.');
      setStep(3);
    }
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
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'border border-glass-border bg-glass'
                  }`}>
                    <p className={`text-[15px] ${msg.role === 'user' ? 'text-white' : 'text-foreground'}`}>
                      {msg.content}
                    </p>
                    {msg.translation && (
                      <p className={`mt-1.5 text-xs ${msg.role === 'user' ? 'text-white/60' : 'text-foreground-secondary'}`}>
                        {msg.translation}
                      </p>
                    )}
                    {msg.corrections && msg.corrections.length > 0 && (
                      <div className="mt-2 border-t border-glass-border pt-2">
                        {msg.corrections.map((c, ci) => (
                          <div key={ci} className="text-xs text-foreground-secondary">
                            <span className="text-destructive line-through">{c.original}</span>
                            {' → '}
                            <span className="text-success">{c.corrected}</span>
                            <p className="mt-0.5 text-foreground-secondary/80">{c.explanation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-glass-border bg-glass px-4 py-3 text-foreground-secondary">
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-glass-border p-4">
            {userMessageCount >= ONBOARDING_TEST_MESSAGES ? (
              <div className="text-center text-sm text-foreground-secondary">
                Evaluating your level...
              </div>
            ) : (
              <div className="flex gap-3">
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
                  placeholder="Type in Japanese... (Alt+Enter to send)"
                  disabled={sending}
                  className="flex-1 rounded-xl border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[15px] text-foreground placeholder:text-[rgba(241,241,247,0.5)] focus:border-primary focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="btn-primary-gradient shrink-0 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-40"
                >
                  Send
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
