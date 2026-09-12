import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      // Check if guest
      const anonId = sessionStorage.getItem('ec_anon_id');
      if (anonId) {
        setUser({ name: 'Guest', mode: 'guest', preferredPersona: 'mom' });
        setLoading(false);
        return;
      }

      // Check account
      try {
        const res = await api.auth.me();
        if (res.success) {
          setUser({ ...res.user, mode: 'account' });
        } else {
          // invalid token
          localStorage.removeItem('ec_token');
          navigate('/auth');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-peach border-t-transparent" />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <main className="dashboard-container mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-10 text-center sm:text-left">
        <h1 className="font-display text-4xl text-ink">
          {getGreeting()}, <span className="text-peach">{user?.name || 'User'}</span>
        </h1>
        <p className="mt-2 text-lg text-muted">
          Welcome to your safe digital space. How can we support you today?
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Chat Card */}
        <div 
          className="dashboard-card card-chat shadow-panel active:scale-[0.98]"
          onClick={() => navigate(`/chat/${user?.preferredPersona || 'mom'}`)}
        >
          <div className="card-icon bg-peach/20 text-peach">💬</div>
          <h2 className="font-display text-2xl text-ink">Start Conversation</h2>
          <p className="mt-2 text-sm text-muted">
            Talk to {user?.preferredPersona || 'mom'}. Your companion is ready to listen with empathy.
          </p>
          <div className="mt-6 flex justify-end">
            <span className="inline-flex rounded-full bg-peach/10 px-3 py-1 text-xs font-semibold text-peach">
              Go to chat →
            </span>
          </div>
        </div>

        {/* Profile Card */}
        <div 
          className="dashboard-card card-profile shadow-panel active:scale-[0.98]"
          onClick={() => navigate('/profile')}
        >
          <div className="card-icon bg-sage/20 text-sage">👤</div>
          <h2 className="font-display text-2xl text-ink">Your Context</h2>
          <p className="mt-2 text-sm text-muted">
            Manage your past conversations, trusted friends, and the knowledge you share.
          </p>
          <div className="mt-6 flex justify-end">
            <span className="inline-flex rounded-full bg-sage/10 px-3 py-1 text-xs font-semibold text-sage">
              View profile →
            </span>
          </div>
        </div>

        {/* Settings Card */}
        <div 
          className="dashboard-card card-settings shadow-panel active:scale-[0.98] sm:col-span-2 lg:col-span-1"
          onClick={() => navigate('/settings')}
        >
          <div className="card-icon bg-sky/20 text-sky">⚙️</div>
          <h2 className="font-display text-2xl text-ink">Account Settings</h2>
          <p className="mt-2 text-sm text-muted">
            Update your persona preferences, display name, and privacy controls.
          </p>
          <div className="mt-6 flex justify-end">
            <span className="inline-flex rounded-full bg-sky/10 px-3 py-1 text-xs font-semibold text-sky">
              Manage settings →
            </span>
          </div>
        </div>
      </section>

      {/* Activity / Info Strip */}
      <section className="mt-12 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-panel backdrop-blur sm:p-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-xl text-white">
              🧠
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">
                Mode: {user?.mode === 'guest' ? 'Guest Access' : 'Full Account'}
              </h3>
              <p className="text-sm text-muted">
                {user?.mode === 'guest' 
                  ? 'Your data will clear after this session.' 
                  : 'Your data is securely synced and protected locally.'}
              </p>
            </div>
          </div>
          {user?.mode === 'guest' && (
            <button 
              className="primary-btn"
              onClick={() => {
                sessionStorage.removeItem('ec_anon_id');
                navigate('/auth');
              }}
            >
              Sign up to save progress
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
