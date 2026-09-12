import { useState, useCallback } from 'react';
import { useVoiceStream } from '../hooks/useVoiceStream';

interface VoiceInterfaceProps {
  onTranscript: (text: string) => void;
  isLoading: boolean;
  color: string;
  status: string;
}

export default function VoiceInterface({ onTranscript, isLoading, color, status }: VoiceInterfaceProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const { isRecording, startRecording, stopRecording, getAudioBlob, error } = useVoiceStream();

  const handleMicDown = useCallback(async () => {
    if (isLoading || isTranscribing) return;
    setIsHolding(true);
    await startRecording();
  }, [isLoading, isTranscribing, startRecording]);

  const handleMicUp = useCallback(async () => {
    setIsHolding(false);
    stopRecording();

    // Wait a moment for final audio chunks to be captured
    await new Promise((resolve) => setTimeout(resolve, 300));

    const audioBlob = getAudioBlob();
    if (!audioBlob || audioBlob.size < 1000) {
      console.log('[Voice] Audio too short, skipping');
      return;
    }

    // Send audio to backend for STT transcription
    setIsTranscribing(true);
    try {
      console.log(`[Voice] Sending ${audioBlob.size} bytes for transcription...`);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || '/api'}/chat/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: audioBlob,
      });

      const result = await response.json();

      if (result.success && result.transcript?.trim()) {
        console.log(`[Voice] Transcribed: "${result.transcript}"`);
        onTranscript(result.transcript);
      } else {
        console.warn('[Voice] Empty transcription or error:', result);
      }
    } catch (err) {
      console.error('[Voice] Transcription request failed:', err);
    } finally {
      setIsTranscribing(false);
    }
  }, [stopRecording, getAudioBlob, onTranscript]);

  const isProcessing = isLoading || isTranscribing;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '16px', padding: '8px 0', maxWidth: '400px', margin: '0 auto',
    }}>
      {/* Animated orb */}
      <div style={{
        width: '120px', height: '120px', borderRadius: '50%',
        background: isRecording
          ? `radial-gradient(circle, ${color}40, ${color}10)`
          : 'radial-gradient(circle, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        transition: 'all 0.3s ease',
        animation: isRecording ? 'pulse-glow 1.5s infinite' : undefined,
        boxShadow: isRecording ? `0 0 60px ${color}30` : '0 0 20px rgba(0,0,0,0.2)',
      }}>
        {/* Inner glow ring */}
        <div style={{
          position: 'absolute', inset: '8px', borderRadius: '50%',
          border: `2px solid ${isRecording ? color : 'rgba(255,255,255,0.08)'}`,
          transition: 'all 0.3s ease',
          animation: isRecording ? 'orb-breathe 2s ease-in-out infinite' : undefined,
        }} />

        {/* Mic button */}
        <button
          onMouseDown={handleMicDown}
          onMouseUp={handleMicUp}
          onMouseLeave={() => { if (isHolding) handleMicUp(); }}
          onTouchStart={handleMicDown}
          onTouchEnd={handleMicUp}
          disabled={isProcessing}
          style={{
            width: '64px', height: '64px', borderRadius: '50%',
            border: 'none',
            background: isRecording
              ? `linear-gradient(135deg, ${color}, ${color}dd)`
              : isTranscribing
                ? `linear-gradient(135deg, ${color}80, ${color}60)`
                : 'rgba(255,255,255,0.08)',
            color: isRecording || isTranscribing ? 'white' : '#a0a0c0',
            cursor: isProcessing ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem',
            transition: 'all 0.2s ease',
            zIndex: 1,
            boxShadow: isRecording ? `0 4px 24px ${color}50` : 'none',
          }}
        >
          {isTranscribing ? (
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              animation: 'spin-slow 0.8s linear infinite',
            }} />
          ) : isRecording ? '🔴' : '🎙️'}
        </button>
      </div>

      {/* Audio level bars */}
      {isRecording && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '32px' }}>
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '4px',
                borderRadius: '2px',
                background: color,
                animation: `wave-bar 1s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Instructions */}
      <p style={{ color: '#6a6a8a', fontSize: '0.8rem', textAlign: 'center' }}>
        {isRecording
          ? 'Listening... Release to send'
          : isTranscribing
            ? 'Transcribing your voice...'
            : isLoading
              ? 'Processing...'
              : 'Hold the mic to speak'}
      </p>

      {error && (
        <p style={{
          color: '#ef4444', fontSize: '0.8rem', textAlign: 'center',
          padding: '8px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)',
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
