import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const PERSONAS = [
  {
    id: 'dad', name: 'Dad', role: 'Calm & Steady', cssClass: 'dad',
    emoji: '👨', color: 'var(--sky)', deepColor: 'var(--sky-deep)',
    topColor: 'var(--sky-deep)',
    desc: 'Grounded and solution-oriented. Dad listens carefully and helps you see things with clarity and logic — without dismissing your feelings.',
    tags: ['Academic pressure', 'Career decisions', 'Life advice'],
  },
  {
    id: 'mom', name: 'Mom', role: 'Warm & Nurturing', cssClass: 'mom',
    emoji: '👩', color: 'var(--blush)', deepColor: 'var(--peach-deep)',
    topColor: 'var(--peach-deep)',
    desc: 'Pure empathy, no judgment. Mom validates how you feel first, holds space for your emotions, and makes you feel truly heard.',
    tags: ['Emotional distress', 'Loneliness', 'Self-doubt'],
  },
  {
    id: 'grandparent', name: 'Grandparent', role: 'Patient & Wise', cssClass: 'grand',
    emoji: '👴', color: 'var(--lavender)', deepColor: 'var(--lavender-deep)',
    topColor: 'var(--lavender-deep)',
    desc: "Unhurried wisdom from a lifetime of experience. Helps you zoom out, find perspective, and feel less alone in whatever you're facing.",
    tags: ['Existential worry', 'Loss & grief', 'Identity'],
  },
  {
    id: 'sibling', name: 'Sibling', role: 'Casual & Real', cssClass: 'sibling',
    emoji: '👦', color: 'var(--sage)', deepColor: 'var(--sage-deep)',
    topColor: 'var(--sage-deep)',
    desc: "The one you can say anything to. Zero judgment, some banter, and genuine care — like texting your closest sibling at 2am.",
    tags: ['Social anxiety', 'Friend drama', 'Venting'],
  },
];

export default function PersonaSelect() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>('mom');
  const [userName, setUserName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const iconRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const selectedPersona = PERSONAS.find((p) => p.id === selected)!;

  const handleSelect = (id: string) => {
    setSelected(id);
    // Trigger select-pop animation
    const el = iconRefs.current[id];
    if (el) {
      el.style.animation = 'none';
      // Force reflow
      void el.offsetHeight;
      el.style.animation = 'selectPop 0.2s ease';
    }
  };

  const handleChat = () => {
    const query = userName ? `?name=${encodeURIComponent(userName)}` : '';
    navigate(`/chat/${selected}${query}`);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 40px', animation: 'fadeUp 0.4s ease' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '52px' }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, marginBottom: '12px' }}>
          Who do you want to<br />talk to <em style={{ fontStyle: 'italic', color: 'var(--lavender-deep)' }}>today?</em>
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-soft)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
          Each persona has a distinct warmth and style. Pick whoever feels right for this moment.
        </p>
      </div>

      {/* Persona Grid */}
      <div
        className="persona-grid-layout"
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px', marginBottom: '40px',
        }}
      >
        {PERSONAS.map((persona) => {
          const isSelected = selected === persona.id;
          return (
            <div
              key={persona.id}
              onClick={() => handleSelect(persona.id)}
              style={{
                background: 'var(--white)', borderRadius: '28px', padding: '32px',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                border: isSelected ? '2.5px solid var(--text)' : '2.5px solid transparent',
                boxShadow: isSelected ? '0 8px 40px rgba(45,42,38,0.15)' : 'none',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Top color bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                borderRadius: '28px 28px 0 0', background: persona.topColor,
              }} />

              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div
                  ref={(el) => { iconRefs.current[persona.id] = el; }}
                  style={{
                    width: '68px', height: '68px', borderRadius: '20px',
                    background: persona.color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '34px',
                  }}
                >
                  {persona.emoji}
                </div>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  border: isSelected ? '2px solid var(--text)' : '2px solid var(--rose)',
                  background: isSelected ? 'var(--text)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}>
                  {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                </div>
              </div>

              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 400, marginBottom: '4px' }}>
                {persona.name}
              </div>
              <div style={{
                fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500,
                letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: '10px',
              }}>
                {persona.role}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-soft)', lineHeight: 1.55, marginBottom: '16px' }}>
                {persona.desc}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {persona.tags.map((tag) => (
                  <span key={tag} style={{
                    fontSize: '11px', padding: '4px 10px', borderRadius: '50px',
                    fontWeight: 500, color: 'var(--text-soft)', background: 'var(--cream)',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => setShowNameModal(true)}>
          Chat with {selectedPersona.name} →
        </button>
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(45,42,38,0.3)', backdropFilter: 'blur(8px)',
        }} onClick={() => setShowNameModal(false)}>
          <div
            style={{
              background: 'var(--white)', borderRadius: '28px', padding: '40px',
              maxWidth: '420px', width: '90%', textAlign: 'center',
              boxShadow: 'var(--shadow-soft)', animation: 'fadeUp 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{selectedPersona.emoji}</div>
            <h3 style={{ fontFamily: "'Fraunces', serif", marginBottom: '8px' }}>
              What's your name?
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              So {selectedPersona.name} can address you personally. You can skip this.
            </p>

            <input
              type="text"
              placeholder="Your first name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChat()}
              autoFocus
              style={{
                width: '100%', padding: '14px 20px', borderRadius: '14px',
                border: '1.5px solid var(--rose)', background: 'var(--cream)',
                color: 'var(--text)', fontSize: '15px', outline: 'none',
                fontFamily: "'DM Sans', sans-serif", marginBottom: '20px',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--text)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--rose)'; }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={handleChat}>Skip</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleChat}>
                Start talking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
