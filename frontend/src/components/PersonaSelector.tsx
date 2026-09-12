import { CSSProperties } from 'react';

interface PersonaData {
  id: string;
  name: string;
  label: string;
  emoji: string;
  description: string;
  color: string;
  gradient: string;
}

interface PersonaSelectorProps {
  personas: PersonaData[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function PersonaSelector({ personas, selected, onSelect }: PersonaSelectorProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px',
      maxWidth: '960px',
      margin: '0 auto',
    }}>
      {personas.map((persona, index) => {
        const isSelected = selected === persona.id;

        const cardStyle: CSSProperties = {
          padding: '32px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          animation: `fade-in-up 0.6s ease-out ${index * 0.1}s forwards`,
          opacity: 0,
          border: isSelected
            ? `2px solid ${persona.color}`
            : '1px solid rgba(255,255,255,0.06)',
          boxShadow: isSelected
            ? `0 0 30px ${persona.color}30, 0 8px 32px rgba(0,0,0,0.3)`
            : '0 8px 32px rgba(0,0,0,0.2)',
          background: isSelected
            ? `rgba(255,255,255,0.08)`
            : 'rgba(255,255,255,0.03)',
          borderRadius: '20px',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        };

        return (
          <div
            key={persona.id}
            style={cardStyle}
            onClick={() => onSelect(persona.id)}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = `${persona.color}60`;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 0 40px ${persona.color}20, 0 12px 40px rgba(0,0,0,0.3)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
              }
            }}
          >
            {/* Glow background */}
            <div style={{
              position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
              background: `radial-gradient(circle at 50% 50%, ${persona.color}08, transparent 60%)`,
              pointerEvents: 'none',
            }} />

            {/* Avatar */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: persona.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 16px',
              boxShadow: `0 4px 20px ${persona.color}40`,
              position: 'relative',
            }}>
              {persona.emoji}
              {isSelected && (
                <div style={{
                  position: 'absolute', bottom: '-4px', right: '-4px',
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', border: '2px solid #0a0a1a',
                }}>
                  ✓
                </div>
              )}
            </div>

            {/* Info */}
            <h3 style={{ marginBottom: '4px', fontSize: '1.1rem', position: 'relative' }}>
              {persona.name}
            </h3>
            <div style={{
              fontSize: '0.75rem', color: persona.color, fontWeight: 500,
              marginBottom: '12px', position: 'relative',
            }}>
              {persona.label}
            </div>
            <p style={{
              fontSize: '0.82rem', lineHeight: 1.5, color: '#8a8aaa',
              position: 'relative',
            }}>
              {persona.description}
            </p>

            {/* Select indicator */}
            <div style={{
              marginTop: '16px', padding: '8px 16px', borderRadius: '9999px',
              background: isSelected ? persona.gradient : 'rgba(255,255,255,0.04)',
              color: isSelected ? 'white' : '#6a6a8a',
              fontSize: '0.8rem', fontWeight: 600,
              transition: 'all 0.3s ease', position: 'relative',
            }}>
              {isSelected ? 'Selected ✓' : 'Select'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
