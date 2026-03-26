'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
}

interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  speak: (text: string) => void;
  stop: () => void;
  unlock: () => void;
}

// Shared AudioContext - survives re-renders, only needs unlock once
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

export function useSpeechSynthesis({
  lang = 'ja-JP',
  rate = 0.9,
  pitch = 1,
}: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const isSupported = typeof window !== 'undefined';

  // Unlock AudioContext - call this during a user gesture (click, keydown)
  const unlock = useCallback(() => {
    if (typeof window === 'undefined') return;
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }, []);

  // Auto-unlock on any user interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleInteraction = () => {
      unlock();
      // Remove listeners after first unlock
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [unlock]);

  const stopAudio = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // Already stopped
      }
      sourceRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Play audio using AudioContext (bypasses autoplay restrictions after unlock)
  const playWithAudioContext = useCallback(
    async (base64Audio: string): Promise<boolean> => {
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Decode base64 to ArrayBuffer
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        sourceRef.current = source;
        setIsSpeaking(true);

        source.onended = () => {
          setIsSpeaking(false);
          sourceRef.current = null;
        };

        source.start(0);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  // Fallback: browser SpeechSynthesis
  const speakWithBrowser = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find((v) => v.lang.startsWith('ja'));
      if (jaVoice) utterance.voice = jaVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [lang, rate, pitch]
  );

  // Primary: Google Cloud TTS via API route
  const speakWithCloudTTS = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) return false;

        const data = await res.json();
        if (!data.audioContent) return false;

        return await playWithAudioContext(data.audioContent);
      } catch {
        return false;
      }
    },
    [playWithAudioContext]
  );

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;
      stopAudio();

      // Try Cloud TTS first, fallback to browser
      speakWithCloudTTS(text).then((success) => {
        if (!success) {
          speakWithBrowser(text);
        }
      });
    },
    [isSupported, stopAudio, speakWithCloudTTS, speakWithBrowser]
  );

  return { isSpeaking, isSupported, speak, stop: stopAudio, unlock };
}
