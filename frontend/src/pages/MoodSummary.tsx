import { useNavigate } from 'react-router-dom';

export default function MoodSummary() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '52px 40px', animation: 'fadeUp 0.4s ease' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '44px' }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, fontSize: '40px', marginBottom: '8px' }}>
          Session recap ✨
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-soft)' }}>
          Here's how your mood shifted during your conversation
        </p>
      </div>

      <div
        className="summary-grid-layout"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}
      >
        {/* Mood Arc — full width */}
        <div style={{
          background: 'var(--white)', borderRadius: '24px', padding: '28px',
          boxShadow: 'var(--shadow-card)', gridColumn: '1 / -1',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase' as const, color: 'var(--text-muted)',
            marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            📈 Mood arc — this session
          </div>
          <div style={{ width: '100%', height: '120px', marginBottom: '12px' }}>
            <svg viewBox="0 0 700 120" fill="none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8D9C8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#C8D9C8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 95 C 60 95, 100 90, 150 78 C 200 66, 240 72, 290 60 C 340 48, 380 52, 430 38 C 480 24, 530 28, 580 18 C 620 10, 660 12, 700 8 L 700 120 L 0 120 Z" fill="url(#grad)" />
              <path d="M 0 95 C 60 95, 100 90, 150 78 C 200 66, 240 72, 290 60 C 340 48, 380 52, 430 38 C 480 24, 530 28, 580 18 C 620 10, 660 12, 700 8" stroke="#8FAF8F" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="0" cy="95" r="5" fill="#8FAF8F" />
              <circle cx="150" cy="78" r="5" fill="#8FAF8F" />
              <circle cx="290" cy="60" r="5" fill="#8FAF8F" />
              <circle cx="430" cy="38" r="5" fill="#8FAF8F" />
              <circle cx="580" cy="18" r="5" fill="#8FAF8F" />
              <circle cx="700" cy="8" r="5" fill="#8FAF8F" />
              <text x="0" y="115" fontSize="10" fill="#A09890" fontFamily="DM Sans">Anxious</text>
              <text x="390" y="55" fontSize="10" fill="#A09890" fontFamily="DM Sans">Calmer</text>
              <text x="655" y="24" fontSize="10" fill="#8FAF8F" fontWeight="600" fontFamily="DM Sans">Hopeful</text>
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Start</span><span>Session duration</span><span>Now</span>
          </div>
        </div>

        {/* Emotion Breakdown */}
        <div style={{ background: 'var(--white)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase' as const, color: 'var(--text-muted)',
            marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            💭 Emotions detected
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { emoji: '😟', label: 'Anxious', pct: 68, color: 'var(--peach)' },
              { emoji: '😔', label: 'Sad', pct: 42, color: 'var(--sky)' },
              { emoji: '🙂', label: 'Hopeful', pct: 35, color: 'var(--sage)' },
              { emoji: '😤', label: 'Frustrated', pct: 22, color: 'var(--lavender)' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px', width: '28px', textAlign: 'center' }}>{e.emoji}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-soft)', width: '80px' }}>{e.label}</span>
                <div style={{ flex: 1, height: '8px', background: 'var(--cream)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '10px', background: e.color, width: `${e.pct}%`, transition: 'width 1s ease' }} />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '32px', textAlign: 'right', fontWeight: 500 }}>{e.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Moments */}
        <div style={{ background: 'var(--white)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase' as const, color: 'var(--text-muted)',
            marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            ✨ Key moments
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { icon: '💛', text: 'You opened up about exam anxiety — a big first step.' },
              { icon: '🌱', text: 'Mood shifted from anxious to hopeful by the end.' },
              { icon: '💬', text: 'Messages exchanged during this session.' },
              { icon: '🔒', text: 'Session stored privately. Expires in 30 days.' },
            ].map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '12px 14px', background: 'var(--cream)', borderRadius: '14px',
                fontSize: '13px', color: 'var(--text-soft)', lineHeight: 1.5,
              }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{h.icon}</span>
                {h.text}
              </div>
            ))}
          </div>
        </div>

        {/* Persona Note — full width */}
        <div style={{
          background: 'var(--white)', borderRadius: '24px', padding: '28px',
          boxShadow: 'var(--shadow-card)', gridColumn: '1 / -1',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase' as const, color: 'var(--text-muted)',
            marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            👩 A note from Mom
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'var(--blush)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '28px',
            }}>👩</div>
            <div>
              <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 400, marginBottom: '2px' }}>Mom</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-soft)', margin: 0 }}>Session summary · Mood: Improving</p>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, var(--lavender), var(--blush))',
            borderRadius: '20px', padding: '24px', position: 'relative',
            fontFamily: "'Fraunces', serif", fontSize: '16px', fontStyle: 'italic',
            color: 'var(--text)', lineHeight: 1.6,
          }}>
            <span style={{
              fontSize: '60px', color: 'rgba(155,136,196,0.3)', position: 'absolute',
              top: '-10px', left: '16px', fontFamily: "'Fraunces', serif", lineHeight: 1,
            }}>"</span>
            You're not a failure because of one exam. You're someone who cares deeply — and that's worth so much more.
            I'm proud of you for talking today. Come back whenever you need me.
          </div>
        </div>
      </div>

      {/* Actions — matching reference order: ghost left, primary right */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '28px' }}>
        <button className="ghost-btn" onClick={() => navigate(-1)}>← Continue session</button>
        <button className="primary-btn" onClick={() => navigate('/profile')}>New session →</button>
      </div>
    </div>
  );
}
