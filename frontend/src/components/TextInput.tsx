import { useState, useRef, useEffect } from 'react';

interface TextInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  color: string;
}

export default function TextInput({ onSend, isLoading, color }: TextInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{
      display: 'flex', gap: '12px', alignItems: 'flex-end',
      maxWidth: '800px', margin: '0 auto', width: '100%',
    }}>
      <div style={{
        flex: 1, position: 'relative',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        transition: 'all 0.3s ease',
      }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isLoading}
          rows={1}
          style={{
            width: '100%',
            padding: '14px 18px',
            background: 'transparent',
            border: 'none',
            color: '#f0f0f8',
            fontSize: '0.95rem',
            fontFamily: 'Inter, sans-serif',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.5,
            minHeight: '48px',
            maxHeight: '120px',
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!text.trim() || isLoading}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          border: 'none',
          background: text.trim() && !isLoading
            ? `linear-gradient(135deg, ${color}, ${color}cc)`
            : 'rgba(255,255,255,0.04)',
          color: text.trim() && !isLoading ? 'white' : '#4a4a6a',
          cursor: text.trim() && !isLoading ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          transition: 'all 0.3s ease',
          flexShrink: 0,
          boxShadow: text.trim() && !isLoading ? `0 4px 16px ${color}40` : 'none',
        }}
      >
        {isLoading ? (
          <div style={{
            width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white', borderRadius: '50%', animation: 'spin-slow 1s linear infinite',
          }} />
        ) : (
          '↑'
        )}
      </button>
    </div>
  );
}
