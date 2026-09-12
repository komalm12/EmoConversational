interface EmotionIndicatorProps {
  emotion: string;
  intensity: number;
  color: string;
}

const EMOTION_EMOJIS: Record<string, string> = {
  joy: '😊',
  sadness: '😢',
  anxiety: '😰',
  anger: '😤',
  fear: '😨',
  surprise: '😲',
  neutral: '😌',
  frustration: '😣',
  loneliness: '🥺',
  overwhelm: '😵‍💫',
};

const EMOTION_LABELS: Record<string, string> = {
  joy: 'Happy',
  sadness: 'Sad',
  anxiety: 'Anxious',
  anger: 'Frustrated',
  fear: 'Scared',
  surprise: 'Surprised',
  neutral: 'Calm',
  frustration: 'Frustrated',
  loneliness: 'Lonely',
  overwhelm: 'Overwhelmed',
};

export default function EmotionIndicator({ emotion, intensity, color }: EmotionIndicatorProps) {
  const emoji = EMOTION_EMOJIS[emotion] || '😌';
  const label = EMOTION_LABELS[emotion] || 'Neutral';
  const glowOpacity = 0.1 + intensity * 0.3;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '9999px',
        background: `${color}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')}`,
        border: `1px solid ${color}30`,
        transition: 'all 0.5s ease',
      }}
      title={`Detected: ${label} (${Math.round(intensity * 100)}%)`}
    >
      <span style={{
        fontSize: '1rem',
        transition: 'transform 0.3s ease',
        display: 'inline-block',
      }}>
        {emoji}
      </span>
      <span style={{
        fontSize: '0.72rem',
        color: color,
        fontWeight: 500,
        letterSpacing: '0.02em',
      }}>
        {label}
      </span>

      {/* Intensity dots */}
      <div style={{ display: 'flex', gap: '2px' }}>
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: intensity >= threshold ? color : `${color}30`,
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
