import { useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  timestamp: string;
}

interface TranscriptPanelProps {
  messages: Message[];
  color: string;
  emoji: string;
  isLoading: boolean;
}

export default function TranscriptPanel({ messages, color, emoji, isLoading }: TranscriptPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      {messages.length === 0 && !isLoading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', flex: 1, gap: '16px', padding: '48px 0',
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}20, ${color}10)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', animation: 'orb-breathe 3s ease-in-out infinite',
          }}>
            {emoji}
          </div>
          <p style={{ color: '#6a6a8a', fontSize: '0.9rem' }}>
            Starting your conversation...
          </p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fade-in 0.4s ease-out',
          }}
        >
          {/* Assistant avatar */}
          {msg.role === 'assistant' && (
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${color}, ${color}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', flexShrink: 0, marginRight: '10px', marginTop: '4px',
            }}>
              {emoji}
            </div>
          )}

          <div
            style={{
              maxWidth: '75%',
              padding: '14px 18px',
              borderRadius: msg.role === 'user'
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? `linear-gradient(135deg, ${color}, ${color}cc)`
                : 'rgba(255,255,255,0.05)',
              border: msg.role === 'user'
                ? 'none'
                : '1px solid rgba(255,255,255,0.06)',
              color: msg.role === 'user' ? 'white' : '#e0e0f0',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              position: 'relative',
            }}
          >
            {msg.content}

            {/* Emotion tag for assistant */}
            {msg.role === 'assistant' && msg.emotion && msg.emotion !== 'neutral' && (
              <div style={{
                marginTop: '8px',
                fontSize: '0.7rem',
                color: '#6a6a8a',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span style={{ fontSize: '0.75rem' }}>
                  {msg.emotion === 'sadness' ? '💙' : msg.emotion === 'anxiety' ? '💛' : msg.emotion === 'joy' ? '💚' : '🤍'}
                </span>
                Responding to: {msg.emotion}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Thinking indicator */}
      {isLoading && (
        <div style={{
          display: 'flex', justifyContent: 'flex-start', animation: 'fade-in 0.3s ease-out',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: `linear-gradient(135deg, ${color}, ${color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem', flexShrink: 0, marginRight: '10px', marginTop: '4px',
          }}>
            {emoji}
          </div>
          <div style={{
            padding: '16px 20px', borderRadius: '18px 18px 18px 4px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: '6px', alignItems: 'center',
          }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: color,
                  animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
