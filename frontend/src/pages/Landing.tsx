import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';

/* ── DATA ── */
const features = [
  {
    icon: '🎙️',
    iconClass: 'feature-icon-voice',
    title: 'Voice & Text Conversations',
    desc: 'Speak or type — CEA-AI listens with real-time emotion awareness and adjusts tone accordingly.',
    accent: '#E0A97A',
  },
  {
    icon: '💛',
    iconClass: 'feature-icon-emotion',
    title: 'Emotion Recognition',
    desc: 'Advanced sentiment analysis detects how you feel and guides the conversation with empathy.',
    accent: '#B5C7AD',
  },
  {
    icon: '🔒',
    iconClass: 'feature-icon-privacy',
    title: 'Privacy-First Design',
    desc: 'Your emotional data stays yours. Local storage, explicit sharing controls, and full transparency.',
    accent: '#C7DBF0',
  },
  {
    icon: '🎭',
    iconClass: 'feature-icon-persona',
    title: 'Persona-Led Support',
    desc: 'Choose a companion persona that matches your comfort style — calm, warm, or motivational.',
    accent: '#dbb4d9',
  },
  {
    icon: '📈',
    iconClass: 'feature-icon-learn',
    title: 'Mood Insights',
    desc: 'Track emotional patterns over time with clear summaries and gentle reflections.',
    accent: '#E0A97A',
  },
  {
    icon: '🛡️',
    iconClass: 'feature-icon-safe',
    title: 'Safe & Guided',
    desc: 'Built-in safeguards ensure conversations stay supportive, never clinical or diagnostic.',
    accent: '#B5C7AD',
  },
];

const howSteps = [
  {
    num: 1,
    emoji: '✨',
    title: 'Create your space',
    desc: 'Sign up in seconds. Choose a persona and set your comfort preferences — no complex setup needed.',
  },
  {
    num: 2,
    emoji: '💬',
    title: 'Start a conversation',
    desc: 'Talk via voice or text about anything on your mind. CEA-AI listens, understands, and responds with empathy.',
  },
  {
    num: 3,
    emoji: '🌱',
    title: 'Grow with insights',
    desc: 'Review mood summaries, track your emotional journey, and build resilience over time at your own pace.',
  },
];

// const testimonials = [
//   {
//     text: "CEA-AI helped me process difficult emotions when I didn't know where to start. The persona felt genuinely warm.",
//     name: 'Alex M.',
//     role: 'Graduate Student',
//     avatar: '👩‍🎓',
//     bg: '#F0DFD2',
//   },
//   {
//     text: 'I love how private it feels. No judgment, no data-sharing anxiety. Just a calm space to reflect and talk.',
//     name: 'Jamie L.',
//     role: 'Product Designer',
//     avatar: '👨‍💻',
//     bg: '#d4e4cb',
//   },
//   {
//     text: 'The mood insights showed me patterns I never noticed. It became part of my daily self-care routine.',
//     name: 'Priya K.',
//     role: 'Wellness Coach',
//     avatar: '👩‍⚕️',
//     bg: '#C7DBF0',
//   },
// ];

const trustItems = [
  {
    icon: '🔐',
    iconClass: 'trust-item-icon-1',
    title: 'Local-first storage',
    desc: 'Profile and session data stored locally for speed and privacy. Nothing leaves your device unless you choose.',
  },
  {
    icon: '👁️',
    iconClass: 'trust-item-icon-2',
    title: 'Explicit sharing controls',
    desc: 'Decide exactly what emotional context to share with trusted contacts. Full granular control.',
  },
  {
    icon: '✅',
    iconClass: 'trust-item-icon-3',
    title: 'Transparent experience',
    desc: 'Clear onboarding, honest AI limitations, and no hidden data flows. You always know what happens.',
  },
];

const stats = [
  { num: '10K', suffix: '+', label: 'Conversations held' },
  { num: '98', suffix: '%', label: 'User satisfaction' },
  { num: '4.9', suffix: '★', label: 'Average rating' },
  { num: '100', suffix: '%', label: 'Privacy focused' },
];

const orbitEmojis = ['😊', '😔', '😤', '🥰', '😌', '🤔', '💪'];

/* ── SCROLL REVEAL HOOK ── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── NAVBAR SCROLL HOOK ── */
function useNavScroll(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      el.classList.toggle('scrolled', window.scrollY > 40);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [ref]);
}

/* ── COMPONENT ── */
export default function Landing() {
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);

  useScrollReveal();
  useNavScroll(navRef);

  const goAuth = useCallback(() => navigate('/auth'), [navigate]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="landing-page">
      {/* ── NAVBAR ── */}
      <nav ref={navRef} className="landing-nav" id="landing-nav">
        <div className="nav-brand">
          <div className="nav-logo">
            <img src="public/logo.png" alt="logo" />
          </div>
          <span className="nav-title">CEA-AI</span>
        </div>
        <div className="nav-links">
          <button className="nav-link" onClick={() => scrollTo('features')}>
            Features
          </button>
          <button className="nav-link" onClick={() => scrollTo('how-it-works')}>
            How it works
          </button>
          <button className="nav-link" onClick={() => scrollTo('trust')}>
            Privacy
          </button>
          <button className="nav-link" onClick={goAuth}>
            Sign in
          </button>
          <button className="nav-cta" onClick={goAuth}>
            Get Started
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero" id="hero">
        {/* background blobs */}
        <div className="hero-bg">
          <div className="hero-bg-gradient" />
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>

        <div className="hero-content">
          {/* Left — copy */}
          <div className="hero-text">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Human-centered emotional AI
            </div>

            <h1 className="hero-title">
              Build emotional resilience with a{' '}
              <em>safe&nbsp;companion.</em>
            </h1>

            <p className="hero-desc">
              CEA-AI helps you navigate stress, reflection, and difficult moments with persona-led conversations,
              clear privacy controls, and mood insights you can trust.
            </p>

            <div className="hero-actions">
              <button className="btn-hero-primary" onClick={goAuth}>
                Start your journey
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button className="btn-hero-secondary" onClick={() => scrollTo('how-it-works')}>
                See how it works
              </button>
            </div>
{/* 
            <div className="hero-proof">
              <div className="hero-avatars">
                <div className="hero-avatar hero-avatar-1">😊</div>
                <div className="hero-avatar hero-avatar-2">🌿</div>
                <div className="hero-avatar hero-avatar-3">💙</div>
                <div className="hero-avatar hero-avatar-4">✨</div>
              </div>
              <p className="hero-proof-text">
                <strong>10,000+</strong> people already building emotional resilience with CEA-AI
              </p>
            </div> */}
          </div>

          {/* Right — Emotion orbit visual */}
          <div className="hero-visual">
            <div className="emotion-orbit-wrap">
              {/* rings */}
              <div className="orbit-ring orbit-ring-1" />
              <div className="orbit-ring orbit-ring-2" />

              {/* center */}
              <div className="orbit-center">
                <span className="orbit-center-icon">🙍‍♂️</span>
              </div>

              {/* orbiting emojis */}
              {orbitEmojis.map((emoji, i) => (
                <div key={i} className={`orbit-emoji orbit-emoji-${i + 1}`}>
                  {emoji}
                </div>
              ))}

              {/* floating chat bubbles */}
              <div className="hero-chat-bubble chat-bubble-1">
                <p>I've been feeling overwhelmed lately…</p>
                <small>You · just now</small>
              </div>
              <div className="hero-chat-bubble chat-bubble-2">
                <p>I hear you. Let's take a moment together.</p>
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      {/* <section className="section" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="section-inner">
          <div className="stats-strip reveal">
            {stats.map((s) => (
              <div className="stat-item" key={s.label}>
                <div className="stat-number">
                  {s.num}
                  <span>{s.suffix}</span>
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── FEATURES ── */}
      <section className="section features-section" id="features">
        <div className="section-inner">
          <div className="features-header reveal">
            <div className="section-label">
              <span className="section-label-line" />
              Core Capabilities
            </div>
            <h2 className="section-title">
              Everything you need for emotional well-being
            </h2>
            <p className="section-subtitle">
              A thoughtful set of tools designed to support you — privately, gently, and on your own terms.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <article
                key={f.title}
                className={`feature-card reveal reveal-delay-${(i % 3) + 1}`}
                style={{ '--card-accent': f.accent } as React.CSSProperties}
              >
                <div className={`feature-icon ${f.iconClass}`}>{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section how-section" id="how-it-works">
        <div className="section-inner">
          <div className="how-header reveal">
            <div className="section-label">
              <span className="section-label-line" />
              Getting Started
            </div>
            <h2 className="section-title">Three steps to a calmer you</h2>
            <p className="section-subtitle">
              No complicated setup, no overwhelming options — just a clear path to meaningful support.
            </p>
          </div>

          <div className="how-steps">
            {howSteps.map((step, i) => (
              <div key={step.num} className={`how-step reveal reveal-delay-${i + 1}`}>
                <div className="how-step-num">
                  <div className="how-step-num-inner">{step.num}</div>
                  <div className="how-step-num-ring" />
                </div>
                <span className="how-step-emoji">{step.emoji}</span>
                <h3 className="how-step-title">{step.title}</h3>
                <p className="how-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONVERSATION PREVIEW ── */}
      <section className="section convo-section" id="conversation">
        <div className="section-inner">
          <div className="convo-grid">
            <div className="convo-mockup reveal">
              <div className="convo-mockup-header">
                <div className="convo-mockup-avatar">🌸</div>
                <div>
                  <div className="convo-mockup-name">Calm Companion</div>
                  <div className="convo-mockup-status">Active now</div>
                </div>
              </div>
              <div className="convo-messages">
                <div className="convo-msg convo-msg-ai">
                  Hey there. I'm glad you're here. How are you feeling today?
                </div>
                <div className="convo-msg convo-msg-user">
                  Work has been really stressful this week. I feel burned out.
                </div>
                <div className="convo-msg convo-msg-ai">
                  That sounds really tough. Burnout is your mind telling you it needs care. Let's talk about what's weighing on you most.
                  <div className="convo-emotion-tag">🧡 Empathetic response detected</div>
                </div>
                <div className="convo-msg convo-msg-user">
                  I think it's the deadlines. Everything feels urgent.
                </div>
              </div>
            </div>

            <div className="convo-info reveal reveal-delay-2">
              <div className="section-label">
                <span className="section-label-line" />
                Live Experience
              </div>
              <h2 className="section-title">Conversations that actually <em>understand</em></h2>
              <p className="section-subtitle" style={{ marginBottom: 28 }}>
                CEA-AI doesn't just respond — it reads emotional cues and adapts in real time.
              </p>
              <ul className="convo-highlights">
                <li className="convo-highlight">
                  <div className="convo-highlight-icon">🎯</div>
                  <div className="convo-highlight-text">
                    <h4>Context-Aware</h4>
                    <p>Remembers your conversation history and emotional patterns within sessions.</p>
                  </div>
                </li>
                <li className="convo-highlight">
                  <div className="convo-highlight-icon">🌊</div>
                  <div className="convo-highlight-text">
                    <h4>Adaptive Tone</h4>
                    <p>Adjusts warmth, pacing and language based on how you're feeling in the moment.</p>
                  </div>
                </li>
                <li className="convo-highlight">
                  <div className="convo-highlight-icon">🛡️</div>
                  <div className="convo-highlight-text">
                    <h4>Guardrails Built-in</h4>
                    <p>Stays supportive and non-clinical. Refers to professional help when appropriate.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST & PRIVACY ── */}
      <section className="section trust-section" id="trust">
        <div className="section-inner">
          <div className="trust-grid">
            <div className="trust-info reveal">
              <div className="section-label">
                <span className="section-label-line" />
                Trust & Privacy
              </div>
              <h2 className="section-title">Your emotions, your control</h2>
              <p className="section-subtitle">
                We believe emotional data is sacred. CEA-AI is designed so you never have to wonder where your data goes.
              </p>
              <ul className="trust-list">
                {trustItems.map((item, i) => (
                  <li key={item.title} className={`trust-item reveal reveal-delay-${i + 1}`}>
                    <div className={`trust-item-icon ${item.iconClass}`}>{item.icon}</div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="trust-visual reveal reveal-delay-2">
              <div className="trust-shield">
                <div className="trust-shield-bg" />
                <span className="trust-shield-icon">🛡️</span>
                <div className="trust-chip-float trust-chip-1">🔒 End-to-end safe</div>
                <div className="trust-chip-float trust-chip-2">👤 You own your data</div>
                <div className="trust-chip-float trust-chip-3">✅ Transparent AI</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {/* <section className="section testimonials-section" id="testimonials">
        <div className="section-inner">
          <div className="testimonials-header reveal">
            <div className="section-label">
              <span className="section-label-line" />
              What People Say
            </div>
            <h2 className="section-title">Trusted by those who need it most</h2>
            <p className="section-subtitle">
              Real perspectives from people building emotional resilience with CEA-AI.
            </p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={t.name} className={`testimonial-card reveal reveal-delay-${i + 1}`}>
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: t.bg }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── CTA ── */}
      <section className="cta-section" id="cta">
        <div className="cta-card reveal">
          <span className="cta-emoji">🌿</span>
          <h2 className="cta-title">
            Ready to start your <em>emotional wellness</em> journey?
          </h2>
          <p className="cta-desc">
            Join thousands of people who chose a calmer, more reflective life with CEA-AI. It's free to start.
          </p>
          <div className="cta-actions">
            <button className="btn-cta-primary" onClick={goAuth}>
              Create free account
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="btn-cta-secondary" onClick={() => scrollTo('features')}>
              Explore features
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="public/logo.png" alt="logo" />
            </div>
            <span className="footer-name">CEA-AI</span>
          </div>
          <div className="footer-links">
            <button className="footer-link" onClick={() => scrollTo('features')}>Features</button>
            <button className="footer-link" onClick={() => scrollTo('trust')}>Privacy</button>
            <button className="footer-link" onClick={() => scrollTo('how-it-works')}>How it works</button>
            <button className="footer-link" onClick={goAuth}>Sign in</button>
          </div>
          <span className="footer-copy">© 2026 CEA-AI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
