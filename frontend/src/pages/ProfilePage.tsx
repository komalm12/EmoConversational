import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface HistoryEntry {
  id: string;
  timestamp: string;
  personaId: string;
  userMessage: string;
  assistantReply: string;
  emotion?: string;
}

interface EditableProfile {
  name: string;
  email: string;
  mode: 'account' | 'guest';
  preferredPersona: string;
  friends: string[];
  knowledgeBase: string[];
  shareContact: boolean;
  contact: string;
  joinedAt: string;
}

const PERSONAS = [
  { id: 'mom', label: 'Mom', description: 'Warm and nurturing support', emoji: '👩' },
  { id: 'dad', label: 'Dad', description: 'Calm and practical grounding', emoji: '👨' },
  { id: 'grandparent', label: 'Grandparent', description: 'Wise and patient perspective', emoji: '👴' },
  { id: 'sibling', label: 'Sibling', description: 'Casual, friendly, and real', emoji: '👦' },
  { id: 'friend', label: 'Friend', description: 'Peer-style empathy and validation', emoji: '🧑' },
];

const safeJson = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const titleFromPersona = (id: string) => PERSONAS.find((item) => item.id === id)?.label || 'Companion';

export default function ProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<EditableProfile>({
    name: 'User',
    email: '',
    mode: 'guest',
    preferredPersona: 'mom',
    friends: [],
    knowledgeBase: [],
    shareContact: false,
    contact: '',
    joinedAt: new Date().toISOString()
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [friendInput, setFriendInput] = useState('');
  const [knowledgeInput, setKnowledgeInput] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local history
    setHistory(safeJson<HistoryEntry[]>(localStorage.getItem('ec_chat_history'), []).slice(0, 12));

    const loadProfile = async () => {
      const anonId = sessionStorage.getItem('ec_anon_id');
      if (anonId) {
        setProfile({
          name: 'Guest User',
          email: '',
          mode: 'guest',
          preferredPersona: 'mom',
          friends: [],
          knowledgeBase: [],
          shareContact: false,
          contact: '',
          joinedAt: new Date().toISOString()
        });
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.me();
        if (res.success) {
          setProfile({
            ...res.user,
            mode: 'account'
          });
          localStorage.setItem('ec_user_profile', JSON.stringify({ ...res.user, mode: 'account' }));
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const addFriend = () => {
    if (!friendInput.trim()) {
      return;
    }
    setProfile((prev) => ({ ...prev, friends: [friendInput.trim(), ...prev.friends] }));
    setFriendInput('');
  };

  const addKnowledge = () => {
    if (!knowledgeInput.trim()) {
      return;
    }
    setProfile((prev) => ({ ...prev, knowledgeBase: [knowledgeInput.trim(), ...prev.knowledgeBase] }));
    setKnowledgeInput('');
  };

  const saveProfile = async () => {
    if (profile.mode === 'account') {
      try {
        const res = await api.auth.updateProfile({
          name: profile.name,
          preferredPersona: profile.preferredPersona,
          friends: profile.friends,
          knowledgeBase: profile.knowledgeBase,
          contact: profile.contact,
          shareContact: profile.shareContact,
        });

        if (res.success) {
          localStorage.setItem('ec_user_profile', JSON.stringify(profile));
          setSavedMessage('Profile updated via cloud');
        }
      } catch (err) {
        setSavedMessage('Failed to sync to cloud');
      }
    } else {
      localStorage.setItem('ec_user_profile', JSON.stringify(profile));
      setSavedMessage('Profile updated locally');
    }
    
    setTimeout(() => setSavedMessage(''), 1400);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-peach border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <section className="panel mb-5 flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Profile dashboard</p>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Your Context & Relationships</h1>
          <p className="mt-2 text-sm text-muted">
            Manage your past conversations, trusted friends, and the knowledge you share.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="ghost-btn" onClick={() => navigate(`/chat/${profile.preferredPersona}`)}>
            Start chat with {titleFromPersona(profile.preferredPersona)}
          </button>
          <button className="primary-btn" onClick={saveProfile}>Save profile</button>
        </div>
      </section>


      {savedMessage && (
        <div className="mb-4 rounded-xl border border-sage/80 bg-sage/30 px-4 py-2 text-sm text-ink">{savedMessage}</div>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-5">
          <h2 className="font-display text-2xl">User details</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-muted">
              Display name
              <input
                className="mt-1 w-full rounded-xl border border-peach/50 bg-white px-3 py-2 text-ink outline-none focus:border-ink"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              />
            </label>
            <label className="block text-sm text-muted">
              Email
              <input
                className="mt-1 w-full rounded-xl border border-peach/50 bg-white px-3 py-2 text-ink outline-none focus:border-ink"
                value={profile.email}
                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
              />
            </label>
            <div className="grid gap-2 rounded-xl border border-white/60 bg-cream p-3 text-sm text-muted sm:grid-cols-2">
              <p>
                Mode: <strong className="text-ink">{profile.mode === 'account' ? 'Account' : 'Guest'}</strong>
              </p>
              <p>
                Joined: <strong className="text-ink">{new Date(profile.joinedAt).toLocaleDateString()}</strong>
              </p>
            </div>
          </div>
        </article>

        <article className="panel p-5">
          <h2 className="font-display text-2xl">Contact sharing</h2>
          <p className="mt-2 text-sm text-muted">Enable this only if you want to share your contact information for follow-up support.</p>
          <label className="mt-4 flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={profile.shareContact}
              onChange={(e) => setProfile((prev) => ({ ...prev, shareContact: e.target.checked }))}
            />
            Allow contact sharing
          </label>
          <label className="mt-3 block text-sm text-muted">
            Contact details
            <input
              className="mt-1 w-full rounded-xl border border-peach/50 bg-white px-3 py-2 text-ink outline-none focus:border-ink"
              value={profile.contact}
              disabled={!profile.shareContact}
              onChange={(e) => setProfile((prev) => ({ ...prev, contact: e.target.value }))}
              placeholder="Phone, email, or trusted contact"
            />
          </label>
        </article>

        <article className="panel p-5 lg:col-span-2">
          <h2 className="font-display text-2xl">Choose your persona from profile</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PERSONAS.map((persona) => {
              const active = profile.preferredPersona === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => setProfile((prev) => ({ ...prev, preferredPersona: persona.id }))}
                  className={`rounded-2xl border p-3 text-left transition ${
                    active
                      ? 'border-ink bg-ink text-white'
                      : 'border-peach/40 bg-white/70 text-ink hover:border-ink'
                  }`}
                >
                  <p className="text-xl">{persona.emoji}</p>
                  <p className="mt-1 font-semibold">{persona.label}</p>
                  <p className={`text-xs ${active ? 'text-white/80' : 'text-muted'}`}>{persona.description}</p>
                </button>
              );
            })}
          </div>
        </article>

        <article className="panel p-5">
          <h2 className="font-display text-2xl">Friend list</h2>
          <p className="mt-2 text-sm text-muted">Add friends you trust and want quick mention references for support context.</p>
          <div className="mt-3 flex gap-2">
            <input
              className="w-full rounded-xl border border-peach/50 bg-white px-3 py-2 text-ink outline-none focus:border-ink"
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value)}
              placeholder="Add friend name"
            />
            <button className="ghost-btn !px-4" onClick={addFriend}>Add</button>
          </div>
          <div className="mt-3 space-y-2">
            {profile.friends.map((friend, index) => (
              <div key={`${friend}_${index}`} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm">
                <span>{friend}</span>
                <button
                  className="text-xs text-muted hover:text-ink"
                  onClick={() =>
                    setProfile((prev) => ({ ...prev, friends: prev.friends.filter((_, i) => i !== index) }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            {!profile.friends.length && <p className="text-sm text-muted">No friends added yet.</p>}
          </div>
        </article>

        <article className="panel p-5">
          <h2 className="font-display text-2xl">Knowledge base you share</h2>
          <p className="mt-2 text-sm text-muted">Tell the system what matters to you so responses stay useful and grounded.</p>
          <div className="mt-3 flex gap-2">
            <input
              className="w-full rounded-xl border border-peach/50 bg-white px-3 py-2 text-ink outline-none focus:border-ink"
              value={knowledgeInput}
              onChange={(e) => setKnowledgeInput(e.target.value)}
              placeholder="Add context you want to share"
            />
            <button className="ghost-btn !px-4" onClick={addKnowledge}>Add</button>
          </div>
          <div className="mt-3 space-y-2">
            {profile.knowledgeBase.map((item, index) => (
              <div key={`${item}_${index}`} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm">
                <span>{item}</span>
                <button
                  className="text-xs text-muted hover:text-ink"
                  onClick={() =>
                    setProfile((prev) => ({ ...prev, knowledgeBase: prev.knowledgeBase.filter((_, i) => i !== index) }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="panel p-5 lg:col-span-2">
          <h2 className="font-display text-2xl">Past conversations</h2>
          <p className="mt-2 text-sm text-muted">Your recent conversation snippets are shown here for continuity and reflection.</p>
          <div className="mt-4 space-y-3">
            {!history.length && (
              <div className="rounded-xl border border-dashed border-peach/40 bg-white/50 px-4 py-3 text-sm text-muted">
                No conversations yet. Start a chat from your profile to populate this timeline.
              </div>
            )}
            {history.map((item) => (
              <div key={item.id} className="rounded-2xl border border-peach/30 bg-white/70 p-4 text-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-xs text-muted">
                  <span>{titleFromPersona(item.personaId)}</span>
                  <span>{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-ink"><strong>You:</strong> {item.userMessage}</p>
                <p className="mt-1 text-ink"><strong>Companion:</strong> {item.assistantReply}</p>
                {item.emotion && <p className="mt-1 text-xs text-muted">Emotion: {item.emotion}</p>}
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
