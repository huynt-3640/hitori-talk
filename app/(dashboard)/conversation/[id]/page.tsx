'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MessageBubble } from '@/components/conversation/message-bubble';
import { MessageInput } from '@/components/conversation/message-input';
import { CompletionCard } from '@/components/conversation/completion-card';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { useSpeechSynthesis } from '@/lib/hooks/use-speech-synthesis';

interface Message {
  id: string;
  role: string;
  content: string;
  corrections?: unknown[] | null;
  translation?: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  ai_role: string;
  context_details: { scenario?: string } | null;
  topic_id: string | null;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [completionData, setCompletionData] = useState<{
    xp_earned: number;
    total_xp: number;
    level: number;
    level_up: boolean;
    previous_level: number;
    streak: number;
    new_achievements: { id: string; name: string; name_ja: string; icon: string; xp_reward: number }[];
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const initialLoadRef = useRef(true);
  const hasSpokenGreetingRef = useRef(false);

  // TTS
  const { speak, stop: stopSpeaking } = useSpeechSynthesis({ lang: 'ja-JP', rate: 0.9 });

  // STT - record audio → send to Google Cloud STT → fill input
  const [sttText, setSttText] = useState('');
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
          setSttText(data.text.trim());
        }
      } catch (err) {
        console.error('STT error:', err);
      } finally {
        setIsTranscribing(false);
      }
    },
  });

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = useCallback((sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setConversation(data.conversation);
        setMessages(data.messages);
        initialLoadRef.current = false;
        // Auto-speak last AI message on load (guard against StrictMode double-mount)
        if (!hasSpokenGreetingRef.current && data.messages?.length > 0) {
          const lastMsg = data.messages[data.messages.length - 1];
          if (lastMsg.role === 'assistant' && lastMsg.content) {
            hasSpokenGreetingRef.current = true;
            speak(lastMsg.content);
          }
        }
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [conversationId, router]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleEnd() {
    setEnding(true);
    stopSpeaking();
    try {
      const res = await fetch(`/api/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elapsed_seconds: elapsed }),
      });
      if (!res.ok) throw new Error('Failed to end conversation');
      const data = await res.json();
      setCompletionData(data);
    } catch {
      // Fallback: just go to dashboard
      router.push('/dashboard');
    } finally {
      setEnding(false);
    }
  }

  async function handleSend(content: string) {
    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error('Failed to send');

      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        // Auto-speak AI response
        if (autoSpeak && data.message.role === 'assistant' && data.message.content) {
          speak(data.message.content);
        }
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-foreground-secondary">Loading conversation...</p>
        </div>
      </div>
    );
  }

  const contextDetails = conversation?.context_details as { scenario?: string } | null;
  const correctionCount = messages.filter(
    (m) => m.role === 'assistant' && m.corrections && Array.isArray(m.corrections) && m.corrections.length > 0
  ).length;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="z-10 flex items-center gap-3 border-b border-glass-border bg-[rgba(15,15,26,0.8)] px-4 py-4 backdrop-blur-xl md:gap-4 md:px-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="glass-card flex h-8 w-8 items-center justify-center rounded-lg text-sm text-foreground md:h-9 md:w-9 md:text-base"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold text-foreground md:text-lg">
            {conversation?.title}
          </h1>
          <p className="truncate text-xs text-foreground-secondary md:text-sm">
            AI: {conversation?.ai_role}
          </p>
        </div>
        <button
          onClick={() => {
            if (autoSpeak) stopSpeaking();
            setAutoSpeak(!autoSpeak);
          }}
          className={cn(
            'shrink-0 rounded-lg px-2 py-1.5 text-sm transition-colors md:px-3 md:py-1.5',
            autoSpeak
              ? 'bg-primary-soft text-primary-light'
              : 'bg-glass-hover text-foreground-secondary'
          )}
          title={autoSpeak ? 'Auto-read ON' : 'Auto-read OFF'}
        >
          {autoSpeak ? '🔊' : '🔇'}
        </button>
        <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary-light md:px-4 md:py-1.5 md:text-base">
          {formatTime(elapsed)}
        </span>
        <button
          onClick={handleEnd}
          disabled={ending}
          className="shrink-0 rounded-lg border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] px-3 py-1.5 text-xs font-semibold text-destructive md:rounded-xl md:px-5 md:py-2 md:text-sm disabled:opacity-50"
        >
          {ending ? '...' : 'End'}
        </button>
      </header>

      {/* Body: Chat + Context Panel */}
      <div className="flex min-h-0 flex-1">
        {/* Chat Panel */}
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          <div className="scrollbar-thin flex-1 overflow-y-auto p-5 md:p-8 md:px-10">
            <div className="mx-auto flex max-w-[800px] flex-col gap-4 md:gap-5">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  corrections={msg.corrections}
                  translation={msg.translation}
                  createdAt={msg.created_at}
                  aiName={conversation?.ai_role}
                  onSpeak={msg.role === 'assistant' ? speak : undefined}
                />
              ))}
              {sending && (
                <div className="flex items-start">
                  <div className="glass-card rounded-2xl rounded-bl-lg px-4 py-3 md:px-5 md:py-4">
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
          <MessageInput
            onSend={handleSend}
            disabled={sending}
            onMicPress={toggleRecording}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            audioLevel={audioLevel}
            externalValue={sttText}
            onExternalValueConsumed={() => setSttText('')}
          />
        </div>

        {/* Context Panel (desktop only) */}
        <aside className="hidden w-[340px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-glass-border bg-[rgba(15,15,26,0.3)] p-6 backdrop-blur-xl lg:flex">
          {/* Scenario */}
          <div>
            <h3 className="mb-3 font-bold text-foreground">📋 Scenario</h3>
            <div className="glass-card flex flex-col gap-3 rounded-2xl p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground-secondary">Your Role</p>
                <p className="mt-1 text-foreground">Developer</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground-secondary">AI Role</p>
                <p className="mt-1 text-foreground">{conversation?.ai_role}</p>
              </div>
              {contextDetails?.scenario && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground-secondary">Context</p>
                  <p className="mt-1 text-foreground">{contextDetails.scenario}</p>
                </div>
              )}
            </div>
          </div>

          {/* Session Stats */}
          <div>
            <h3 className="mb-3 font-bold text-foreground">📊 This Session</h3>
            <div className="glass-card flex flex-col rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-glass-border py-2">
                <span className="text-sm text-foreground-secondary">Duration</span>
                <span className="font-semibold">{formatTime(elapsed)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-glass-border py-2">
                <span className="text-sm text-foreground-secondary">Messages</span>
                <span className="font-semibold">{messages.length}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground-secondary">Corrections</span>
                <span className="font-semibold text-warning">{correctionCount}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Completion Overlay */}
      {completionData && (
        <CompletionCard
          xpEarned={completionData.xp_earned}
          totalXP={completionData.total_xp}
          level={completionData.level}
          levelUp={completionData.level_up}
          previousLevel={completionData.previous_level}
          streak={completionData.streak}
          newAchievements={completionData.new_achievements}
        />
      )}
    </div>
  );
}
