import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');
  
  // Form fields
  const [name, setName] = useState('');
  const [preferredPersona, setPreferredPersona] = useState('mom');
  const [shareContact, setShareContact] = useState(false);
  const [contact, setContact] = useState('');

  const PERSONAS = [
    { id: 'mom', label: 'Mom', emoji: '👩' },
    { id: 'dad', label: 'Dad', emoji: '👨' },
    { id: 'grandparent', label: 'Grandparent', emoji: '👴' },
    { id: 'sibling', label: 'Sibling', emoji: '👦' },
    { id: 'friend', label: 'Friend', emoji: '🧑' },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const anonId = sessionStorage.getItem('ec_anon_id');
      if (anonId) {
        setUser({ name: 'Guest', mode: 'guest' });
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.me();
        if (res.success) {
          setUser({ ...res.user, mode: 'account' });
          setName(res.user.name);
          setPreferredPersona(res.user.preferredPersona);
          setShareContact(res.user.shareContact);
          setContact(res.user.contact);
        } else {
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

  const handleSave = async () => {
    if (user?.mode === 'guest') {
      setSavedMessage('Settings cannot be saved in guest mode.');
      setTimeout(() => setSavedMessage(''), 2000);
      return;
    }

    try {
      const res = await api.auth.updateProfile({
        name,
        preferredPersona,
        shareContact,
        contact: shareContact ? contact : '',
      });

      if (res.success) {
        localStorage.setItem('ec_user_profile', JSON.stringify({ ...res.user, mode: 'account' }));
        setSavedMessage('Settings successfully updated.');
        setTimeout(() => setSavedMessage(''), 2000);
      }
    } catch (err) {
      setSavedMessage('Failed to update settings.');
      setTimeout(() => setSavedMessage(''), 2000);
    }
  };

  const clearGuestSession = () => {
    sessionStorage.removeItem('ec_anon_id');
    localStorage.removeItem('ec_user_profile');
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-peach border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Preferences</p>
        <h1 className="font-display text-4xl text-ink">Account Settings</h1>
      </header>

      {savedMessage && (
        <div className="mb-6 rounded-xl border border-sage/80 bg-sage/30 px-4 py-3 text-sm text-ink">
          {savedMessage}
        </div>
      )}

      {user?.mode === 'guest' ? (
        <section className="panel p-6 sm:p-8">
          <h2 className="font-display text-2xl text-ink">Guest Account</h2>
          <p className="mt-2 text-muted">You are currently using a temporary guest session. Your settings and conversational history will not be saved across devices.</p>
          <div className="mt-6 border-t border-blush pt-6">
            <button className="primary-btn" onClick={clearGuestSession}>
              Sign up for an account
            </button>
          </div>
        </section>
      ) : (
        <section className="grid gap-6">
          <div className="panel p-6 sm:p-8">
            <h2 className="font-display text-2xl text-ink">General Profile</h2>
            <p className="mt-2 text-sm text-muted">Update your display name and companion preference.</p>
            
            <div className="mt-6 space-y-4 max-w-md">
              <label className="block text-sm text-muted">
                Display Name
                <input
                  className="mt-1 w-full rounded-xl border border-peach/50 bg-cream px-3 py-2 text-ink outline-none focus:border-ink focus:bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="block text-sm text-muted">
                Default Companion
                <select
                  className="mt-1 w-full rounded-xl border border-peach/50 bg-cream px-3 py-2 text-ink outline-none focus:border-ink focus:bg-white"
                  value={preferredPersona}
                  onChange={(e) => setPreferredPersona(e.target.value)}
                >
                  {PERSONAS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="panel p-6 sm:p-8">
            <h2 className="font-display text-2xl text-ink">Privacy & Contacts</h2>
            <p className="mt-2 text-sm text-muted">Manage if our AI can suggest sharing session notes with your specified trusted contact.</p>
            
            <div className="mt-6 space-y-4 max-w-md">
              <label className="flex items-center gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={shareContact}
                  onChange={(e) => setShareContact(e.target.checked)}
                  className="h-4 w-4 rounded border-peach/50 text-ink focus:ring-ink"
                />
                Allow trusted contact sharing
              </label>

              <label className={`block text-sm text-muted transition-opacity ${!shareContact ? 'opacity-50' : 'opacity-100'}`}>
                Trusted Contact Detail (Email or Phone)
                <input
                  className="mt-1 w-full rounded-xl border border-peach/50 bg-cream px-3 py-2 text-ink outline-none focus:border-ink focus:bg-white disabled:bg-gray-100"
                  value={contact}
                  disabled={!shareContact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="name@example.com"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button className="ghost-btn" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
            <button className="primary-btn" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
