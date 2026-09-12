import React from 'react';

const PERSONAS = ['👩 Mom', '👨 Dad', '👴 Grandparent', '👦 Sibling'];

const TRUST = [
  '🔒 Anonymous mode available',
  '💾 Auto-expires in 30 days',
];

export default function BrandPanel() {
  return (
    <div className="auth-left">
      {/* Brand mark */}
      <div className="brand-mark">
        <div className="brand-icon">🧠</div>
        <span className="brand-name">EmoCompanion</span>
      </div>

      {/* Hero copy */}
      <div className="left-content">
        <h2 className="left-tagline">
          Your feelings<br />
          deserve a <em>safe</em><br />
          place to land.
        </h2>
        <p className="left-sub">
          Create an account to remember your persona preferences,
          track your mood over time, and build a space that's truly yours.
        </p>
        <div className="persona-strip">
          {PERSONAS.map((p) => (
            <div className="persona-chip" key={p}>{p}</div>
          ))}
        </div>
      </div>

      {/* Trust footer */}
      <div className="left-footer">
        <div className="trust-chips">
          {TRUST.map((t) => (
            <div className="trust-chip" key={t}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
