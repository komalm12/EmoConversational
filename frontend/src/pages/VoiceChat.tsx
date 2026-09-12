import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useVoiceStream } from '../hooks/useVoiceStream';
import { useAudioPlayback } from '../hooks/useAudioPlayback';

const PERSONA_META: Record<string, { emoji: string; color: string; deepColor: string; role: string }> = {
  dad: { emoji: '👨', color: 'var(--sky)', deepColor: 'var(--sky-deep)', role: 'Calm & Steady' },
  mom: { emoji: '👩', color: 'var(--blush)', deepColor: 'var(--peach-deep)', role: 'Warm & Nurturing' },
  grandparent: { emoji: '👴', color: 'var(--lavender)', deepColor: 'var(--lavender-deep)', role: 'Patient & Wise' },
  sibling: { emoji: '👦', color: 'var(--sage)', deepColor: 'var(--sage-deep)', role: 'Casual & Real' },
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  time: string;
}

const saveHistoryEntry = (entry: {
  personaId: string;
  userMessage: string;
  assistantReply: string;
  emotion?: string;
}) => {
  const storageKey = 'ec_chat_history';
  const prevRaw = localStorage.getItem(storageKey);
  const prev = prevRaw ? JSON.parse(prevRaw) : [];
  const next = [
    {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    },
    ...prev,
  ].slice(0, 40);
  localStorage.setItem(storageKey, JSON.stringify(next));
};

export default function VoiceChat() {
  const { personaId = 'mom' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userName = searchParams.get('name') || undefined;

  const meta = PERSONA_META[personaId] || PERSONA_META.mom;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [emotionIntensity, setEmotionIntensity] = useState(0.3);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [startTime] = useState(Date.now());
  const [moodTrend, setMoodTrend] = useState('Listening...');
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isRecording, startRecording, stopRecording, getAudioBlob, error: micError } = useVoiceStream();
  const { isPlaying, isFetching: isTtsFetching, speakText, stopPlayback, unlockAudio } = useAudioPlayback();
  const handleSendRef = useRef<(text: string) => void>(() => {});

  const getTime = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Init session
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const result = await api.startChat(personaId, userName);
        if (cancelled) return;
        setSessionId(result.sessionId);
        setMessages([{ role: 'assistant', content: result.greeting, time: getTime() }]);

        // Speak greeting if not muted
        if (!isMuted) {
          speakText(result.greeting, personaId).catch(() => {});
        }
      } catch {
        setMessages([{ role: 'assistant', content: "Hey, I'm here for you. Tell me what's on your mind.", time: getTime() }]);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [personaId, userName]);

  // Send message
  const handleSend = useCallback(async (text: string) => {
    if (!sessionId || !text.trim() || isLoading) return;

    // Unlock audio on user gesture so TTS can play later
    unlockAudio();
    // Stop any playing audio when user sends a new message
    stopPlayback();

    setMessages((prev) => [...prev, { role: 'user', content: text, time: getTime() }]);
    setIsLoading(true);
    setTextInput('');

    try {
      const result = await api.sendMessage(sessionId, text);
      if (result.emotion) {
        setCurrentEmotion(result.emotion.detected);
        setEmotionIntensity(result.emotion.intensity);
        setMoodTrend(result.emotion.detected === 'joy' ? '↗ Improving' : result.emotion.detected === 'neutral' ? '→ Stable' : '↘ Needs support');
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: result.response, emotion: result.emotion?.detected, time: getTime() }]);
      saveHistoryEntry({
        personaId,
        userMessage: text,
        assistantReply: result.response,
        emotion: result.emotion?.detected,
      });

      // Auto-speak the response if not muted
      if (!isMuted) {
        speakText(result.response, personaId).catch((err) => {
          console.warn('[Voice] TTS playback failed:', err);
        });
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "I'm sorry, let me try again. I'm here for you.", time: getTime() }]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading, isMuted, personaId, speakText, stopPlayback, unlockAudio]);

  // Keep ref in sync for mic toggle
  handleSendRef.current = handleSend;

  // Toggle recording
  const handleMicToggle = useCallback(async () => {
    // Unlock audio context on every mic interaction
    unlockAudio();

    if (isRecording) {
      stopRecording();
      // Wait for MediaRecorder's final ondataavailable to fire
      await new Promise((r) => setTimeout(r, 500));
      const audioBlob = getAudioBlob();
      console.log('[Voice] Audio blob:', audioBlob?.size, 'bytes');
      if (!audioBlob || audioBlob.size < 1000) {
        console.warn('[Voice] Audio too short or empty, skipping');
        return;
      }

      setIsTranscribing(true);
      try {
        const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL || '/api'}/chat/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: audioBlob,
        });
        const result = await resp.json();
        console.log('[Voice] Transcription result:', result);
        if (result.success && result.transcript?.trim()) {
          handleSendRef.current(result.transcript);
        } else {
          console.warn('[Voice] No transcript in result:', result);
        }
      } catch (err) {
        console.error('[Voice] Transcription failed:', err);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // Stop any playing audio when user starts recording
      stopPlayback();
      await startRecording();
    }
  }, [isRecording, stopRecording, getAudioBlob, startRecording, stopPlayback, unlockAudio]);

  // Replay a specific message
  const handleReplay = useCallback((text: string) => {
    if (isPlaying || isTtsFetching) {
      stopPlayback();
      return;
    }
    speakText(text, personaId).catch(() => {});
  }, [isPlaying, isTtsFetching, personaId, speakText, stopPlayback]);

  const elapsedMin = Math.floor((Date.now() - startTime) / 60000);

  // Emotion bars data
  const emotions = [
    { label: '😟 Anxious', pct: currentEmotion === 'anxiety' ? emotionIntensity * 100 : 15, color: 'var(--peach)' },
    { label: '😔 Sad', pct: currentEmotion === 'sadness' ? emotionIntensity * 100 : 10, color: 'var(--sky)' },
    { label: '😤 Frustrated', pct: currentEmotion === 'anger' || currentEmotion === 'frustration' ? emotionIntensity * 100 : 8, color: 'var(--lavender)' },
    { label: '🙂 Calm', pct: currentEmotion === 'neutral' || currentEmotion === 'joy' ? emotionIntensity * 100 : 20, color: 'var(--sage)' },
  ];

  return (
    <div style={{ height: 'calc(100vh - 65px)', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, animation: 'fadeUp 0.4s ease' }}>
      {/* ── Sidebar ── */}
      <div style={{
        background: 'var(--white)', borderRight: '1px solid rgba(232,196,176,0.4)',
        display: 'flex', flexDirection: 'column', padding: '28px 20px', gap: '20px',
      }}>
        {/* Active persona */}
        <div style={{
          background: 'linear-gradient(135deg, var(--blush), var(--peach))',
          borderRadius: '20px', padding: '24px 20px', textAlign: 'center',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: 'rgba(255,255,255,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '36px',
            margin: '0 auto 12px',
          }}>{meta.emoji}</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 400, marginBottom: '4px' }}>
            {personaId.charAt(0).toUpperCase() + personaId.slice(1)}
          </div>
          <div style={{
            fontSize: '12px', color: '#3D6B3D', background: 'rgba(200,217,200,0.7)',
            padding: '4px 10px', borderRadius: '50px', display: 'inline-block', fontWeight: 500,
          }}>
            ● {isPlaying ? 'Speaking' : isLoading ? 'Thinking...' : isTtsFetching ? 'Preparing voice...' : 'Listening'}
          </div>
        </div>

        {/* Live emotion */}
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', paddingLeft: '4px' }}>
          Live emotion
        </div>
        <div style={{ background: 'var(--cream)', borderRadius: '16px', padding: '16px' }}>
          {emotions.map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < emotions.length - 1 ? '10px' : 0 }}>
              <span style={{ fontSize: '13px', color: 'var(--text-soft)' }}>{e.label}</span>
              <div style={{ width: '100px', height: '6px', background: 'var(--blush)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '10px', background: e.color, width: `${Math.min(100, e.pct)}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Session info */}
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', paddingLeft: '4px' }}>
          Session
        </div>
        <div style={{ background: 'var(--cream)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Duration', value: `${elapsedMin || '<1'} min` },
            { label: 'Messages', value: `${messages.length}` },
            { label: 'Mood trend', value: moodTrend },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Switch persona */}
        <button
          onClick={() => navigate('/profile')}
          style={{
            background: 'transparent', border: '1.5px solid var(--rose)',
            borderRadius: '12px', padding: '10px', fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', color: 'var(--text-soft)', cursor: 'pointer',
            transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px', marginTop: 'auto',
          }}
        >
          ↩ Switch persona
        </button>
      </div>

      {/* ── Chat Main ── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top bar */}
        <div style={{
          padding: '18px 32px', borderBottom: '1px solid rgba(232,196,176,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(253,248,243,0.8)', backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: meta.color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '20px',
            }}>{meta.emoji}</div>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 400 }}>
                {personaId.charAt(0).toUpperCase() + personaId.slice(1)}
                {userName ? ` · ${userName}` : ''}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Feeling: {currentEmotion} {currentEmotion === 'neutral' ? '🌿' : currentEmotion === 'joy' ? '☀️' : '💙'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Mute/Unmute toggle */}
            <button
              onClick={() => {
                if (isPlaying) stopPlayback();
                setIsMuted((m) => !m);
              }}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                border: '1.5px solid var(--rose)',
                background: isMuted ? 'var(--rose)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', cursor: 'pointer',
                color: isMuted ? 'white' : 'var(--text-soft)',
                transition: 'all 0.2s ease',
              }}
              title={isMuted ? 'Unmute voice responses' : 'Mute voice responses'}
              id="mute-toggle"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                border: '1.5px solid var(--rose)', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', cursor: 'pointer', color: 'var(--text-soft)',
                transition: 'all 0.2s ease',
              }}
              title="Session notes"
            >📝</button>
            <button
              onClick={() => navigate('/summary')}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                border: '1.5px solid var(--rose)', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', cursor: 'pointer', color: 'var(--text-soft)',
                transition: 'all 0.2s ease',
              }}
              title="End session"
            >✓</button>
          </div>
        </div>

        {/* Speaking indicator bar */}
        {(isPlaying || isTtsFetching) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '8px 0', background: 'linear-gradient(90deg, rgba(200,217,200,0.3), rgba(200,217,200,0.1))',
            borderBottom: '1px solid rgba(200,217,200,0.3)',
          }}>
            {isTtsFetching ? (
              <>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: '2px solid var(--sage-deep)', borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ fontSize: '12px', color: 'var(--sage-deep)', fontWeight: 500 }}>
                  Preparing voice...
                </span>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center', height: '16px' }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} style={{
                      width: '3px', borderRadius: '3px', background: 'var(--sage-deep)',
                      animation: `vwave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--sage-deep)', fontWeight: 500 }}>
                  {meta.emoji} Speaking...
                </span>
                <button
                  onClick={stopPlayback}
                  style={{
                    background: 'rgba(61,107,61,0.15)', border: 'none', borderRadius: '6px',
                    padding: '2px 8px', fontSize: '11px', color: 'var(--sage-deep)',
                    cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Stop
                </button>
              </>
            )}
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '28px 32px',
          display: 'flex', flexDirection: 'column', gap: '16px',
          scrollBehavior: 'smooth',
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'flex-end', gap: '10px',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              animation: 'fadeUp 0.3s ease',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: msg.role === 'user' ? '13px' : '16px', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--text)' : meta.color,
                color: msg.role === 'user' ? 'white' : 'inherit',
                fontWeight: msg.role === 'user' ? 600 : 400,
              }}>
                {msg.role === 'user' ? (userName?.[0]?.toUpperCase() || 'You') : meta.emoji}
              </div>
              <div>
                <div style={{
                  maxWidth: '68%', padding: '14px 18px', fontSize: '14px', lineHeight: 1.6,
                  borderRadius: msg.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                  background: msg.role === 'user' ? 'var(--text)' : 'var(--white)',
                  color: msg.role === 'user' ? 'var(--white)' : 'var(--text)',
                  boxShadow: msg.role === 'user' ? 'none' : '0 2px 12px rgba(45,42,38,0.06)',
                  position: 'relative',
                }}>
                  {msg.content}
                  {/* Speaker replay button for assistant messages */}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleReplay(msg.content)}
                      title="Replay this message"
                      style={{
                        position: 'absolute', bottom: '6px', right: '6px',
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'rgba(45,42,38,0.06)', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                        opacity: 0.5,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                    >
                      🔊
                    </button>
                  )}
                </div>
                <div style={{
                  fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}>{msg.time}</div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: meta.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '16px',
              }}>{meta.emoji}</div>
              <div style={{
                display: 'flex', gap: '4px', padding: '14px 18px',
                background: 'var(--white)', borderRadius: '4px 20px 20px 20px',
                boxShadow: '0 2px 12px rgba(45,42,38,0.06)',
              }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: 'var(--rose)', animation: `bounce 1.2s infinite ease-in-out ${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '16px 24px 20px', borderTop: '1px solid rgba(232,196,176,0.3)',
          background: 'var(--white)',
        }}>
          {/* Voice button row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '36px' }}>
              {[0,1,2,3,4,5,6,7].map((i) => (
                <div key={i} style={{
                  width: '3px', borderRadius: '3px', background: 'var(--sage-deep)',
                  animation: isRecording ? `vwave 0.8s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
                  height: isRecording ? undefined : '6px', opacity: isRecording ? undefined : 0.4,
                }} />
              ))}
            </div>
            <button
              onClick={handleMicToggle}
              disabled={isTranscribing || isLoading}
              id="mic-button"
              style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: isRecording ? '#E84040' : isTranscribing ? '#D4845A' : 'var(--text)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px', cursor: isTranscribing ? 'default' : 'pointer', transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(45,42,38,0.2)',
                animation: isRecording ? 'pulse-red 1.5s infinite' : 'none',
              }}
            >
              {isTranscribing ? '⏳' : isRecording ? '⏹' : '🎙️'}
            </button>
            <div style={{ width: '96px', textAlign: 'center', fontSize: '12px', color: isRecording ? '#E84040' : 'var(--text-muted)' }}>
              {isTranscribing ? 'Transcribing…' : isRecording ? 'Listening…' : 'Tap to speak'}
            </div>
          </div>
          {micError && <p style={{ color: '#E84040', fontSize: '12px', textAlign: 'center', marginBottom: '8px' }}>{micError}</p>}

          {/* Text input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--cream)', border: '1.5px solid var(--rose)',
            borderRadius: '50px', padding: '8px 8px 8px 20px',
            transition: 'border-color 0.2s ease',
          }}>
            <input
              type="text"
              placeholder="Or type here if you prefer…"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(textInput); } }}
              disabled={isLoading}
              id="text-input"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--text)',
              }}
            />
            <button
              onClick={() => handleSend(textInput)}
              disabled={!textInput.trim() || isLoading}
              id="send-button"
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--text)', border: 'none', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                cursor: 'pointer', color: 'white', flexShrink: 0,
                transition: 'transform 0.2s ease', opacity: textInput.trim() ? 1 : 0.4,
              }}
            >➤</button>
          </div>
        </div>
      </div>

      {/* CSS animations for spin (used by TTS indicator) */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
