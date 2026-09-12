import { useCallback, useRef, useState } from 'react';

/** Voice config for browser SpeechSynthesis fallback */
const PERSONA_VOICE_HINTS: Record<string, { gender: 'male' | 'female'; pitch: number; rate: number }> = {
  dad: { gender: 'male', pitch: 0.9, rate: 0.9 },
  mom: { gender: 'female', pitch: 1.1, rate: 0.95 },
  grandparent: { gender: 'male', pitch: 0.8, rate: 0.85 },
  sibling: { gender: 'male', pitch: 1.0, rate: 1.05 },
};

interface UseAudioPlaybackReturn {
  isPlaying: boolean;
  isFetching: boolean;
  playAudio: (audioData: ArrayBuffer) => Promise<void>;
  speakText: (text: string, personaId: string) => Promise<void>;
  stopPlayback: () => void;
  /** Call this on any user gesture (click/tap) to unlock audio */
  unlockAudio: () => void;
  error: string | null;
}

/**
 * Hook for managing text-to-speech audio playback.
 * Uses Web Audio API (AudioContext) for reliable playback — once the
 * context is unlocked via a user gesture, all subsequent plays work
 * regardless of timing.
 */
export function useAudioPlayback(): UseAudioPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistent AudioContext — survives across multiple plays
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isUnlockedRef = useRef(false);

  /** Get or create the AudioContext */
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  /**
   * Unlock audio playback. Call this on ANY user gesture (click, tap, keypress).
   * Once unlocked, audio plays reliably regardless of timing.
   */
  const unlockAudio = useCallback(() => {
    if (isUnlockedRef.current) return;

    try {
      const ctx = getAudioContext();

      // Resume the context if it's suspended (Chrome suspends by default)
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          console.log('[Audio] AudioContext resumed');
        });
      }

      // Play a tiny silent buffer to fully unlock
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      isUnlockedRef.current = true;
      console.log('[Audio] Audio playback unlocked');
    } catch (e) {
      console.warn('[Audio] Failed to unlock:', e);
    }
  }, [getAudioContext]);

  /** Stop any currently playing audio */
  const stopPlayback = useCallback(() => {
    // Stop Web Audio API source
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // Already stopped
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    // Stop browser SpeechSynthesis
    if (utteranceRef.current) {
      window.speechSynthesis?.cancel();
      utteranceRef.current = null;
    }
    setIsPlaying(false);
    setIsFetching(false);
  }, []);

  /** Play audio from raw ArrayBuffer (WAV) using Web Audio API */
  const playAudio = useCallback(async (audioData: ArrayBuffer): Promise<void> => {
    try {
      setError(null);
      stopPlayback();

      const ctx = getAudioContext();

      // Resume context if suspended
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Decode the WAV data into an AudioBuffer
      const audioBuffer = await ctx.decodeAudioData(audioData.slice(0));

      // Create source and play
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      sourceNodeRef.current = source;

      return new Promise<void>((resolve) => {
        source.onended = () => {
          setIsPlaying(false);
          sourceNodeRef.current = null;
          resolve();
        };

        setIsPlaying(true);
        source.start(0);
        console.log(`[Audio] Playing ${audioBuffer.duration.toFixed(1)}s of audio`);
      });
    } catch (err: any) {
      setIsPlaying(false);
      console.error('[Audio] playAudio error:', err);
      setError(err.message || 'Playback failed');
      throw err;
    }
  }, [getAudioContext, stopPlayback]);

  /** Fallback: browser's built-in SpeechSynthesis API */
  const speakWithBrowserTTS = useCallback((text: string, personaId: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Browser speech synthesis not available'));
        return;
      }

      stopPlayback();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      const hints = PERSONA_VOICE_HINTS[personaId] || PERSONA_VOICE_HINTS.mom;
      utterance.pitch = hints.pitch;
      utterance.rate = hints.rate;
      utterance.volume = 1;

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
        const genderHint = hints.gender;
        const femaleKeywords = ['female', 'zira', 'samantha', 'karen', 'fiona', 'moira', 'tessa', 'victoria'];
        const maleKeywords = ['male', 'david', 'mark', 'james', 'alex', 'daniel', 'fred', 'tom'];
        const keywords = genderHint === 'female' ? femaleKeywords : maleKeywords;
        const matched = englishVoices.find((v) =>
          keywords.some((kw) => v.name.toLowerCase().includes(kw))
        );
        utterance.voice = matched || englishVoices[0] || voices[0];
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        utteranceRef.current = null;
        resolve();
      };
      utterance.onerror = (e) => {
        setIsPlaying(false);
        utteranceRef.current = null;
        reject(new Error(e.error || 'Speech synthesis failed'));
      };

      console.log(`[Audio] Browser TTS fallback: voice=${utterance.voice?.name || 'default'}`);
      window.speechSynthesis.speak(utterance);
    });
  }, [stopPlayback]);

  /** Fetch TTS audio from backend and play it, falling back to browser TTS */
  const speakText = useCallback(async (text: string, personaId: string) => {
    if (!text.trim()) return;

    setIsFetching(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || '/api'}/chat/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, personaId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `TTS failed (${response.status})`);
      }

      const audioData = await response.arrayBuffer();

      if (audioData.byteLength < 100) {
        throw new Error('Received empty audio response');
      }

      console.log(`[Audio] Server TTS: ${audioData.byteLength} bytes, playing...`);
      setIsFetching(false);
      await playAudio(audioData);
    } catch (serverErr: any) {
      console.warn('[Audio] Server TTS failed, trying browser fallback:', serverErr.message);

      try {
        setIsFetching(false);
        await speakWithBrowserTTS(text, personaId);
      } catch (browserErr: any) {
        console.error('[Audio] Browser TTS also failed:', browserErr);
        setError('Voice unavailable');
      }
    }
  }, [playAudio, speakWithBrowserTTS]);

  return { isPlaying, isFetching, playAudio, speakText, stopPlayback, unlockAudio, error };
}
