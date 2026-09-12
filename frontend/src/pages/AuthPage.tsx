import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const PERSONAS = ['mom', 'dad', 'grandparent', 'sibling', 'friend'];

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredPersona, setPreferredPersona] = useState('mom');

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.auth.login({ email: loginEmail, password: loginPassword });
      
      if (res.success) {
        localStorage.setItem('ec_token', res.token);
        localStorage.setItem('ec_active_user_email', res.user.email);
        localStorage.setItem('ec_user_profile', JSON.stringify({ ...res.user, mode: 'account' }));
        navigate('/dashboard');
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Please provide name, valid email, and password with at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.auth.register({ name, email, password, preferredPersona });
      
      if (res.success) {
        localStorage.setItem('ec_token', res.token);
        localStorage.setItem('ec_active_user_email', res.user.email);
        localStorage.setItem('ec_user_profile', JSON.stringify({ ...res.user, mode: 'account' }));
        navigate('/dashboard');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err: any) {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const enterGuest = () => {
    sessionStorage.setItem('ec_anon_id', `anon_${Math.random().toString(36).slice(2, 10)}`);
    navigate('/dashboard');
  };

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="panel relative overflow-hidden p-8">
        <div className="absolute -top-20 right-0 h-48 w-48 rounded-full bg-sky/50 blur-3xl" />
        <h1 className="font-display text-4xl text-ink">Welcome to a calmer digital space.</h1>
        <p className="mt-4 text-muted">
          Log in to continue your support journey, or create a new account to unlock profile personalization, persona control, and friend management.
        </p>

        <div className="mt-8 space-y-3 text-sm">
          {['Private by design', 'Profile-first setup', 'Friend and context sharing'].map((item) => (
            <div key={item} className="rounded-xl border border-blush bg-white/70 px-4 py-3 text-muted">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-7 sm:p-8">
        <div className="mb-6 flex rounded-full border border-white/70 bg-cream p-1">
          <button
            onClick={() => setTab('login')}
            className={`w-1/2 rounded-full py-2 text-sm font-medium transition ${
              tab === 'login' ? 'bg-ink text-white' : 'text-muted'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`w-1/2 rounded-full py-2 text-sm font-medium transition ${
              tab === 'signup' ? 'bg-ink text-white' : 'text-muted'
            }`}
          >
            Create account
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {tab === 'login' ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <label className="block text-sm text-muted">
              Email
              <input
                className="mt-1 w-full rounded-xl border border-peach/50 bg-white px-3 py-2 text-ink outline-none focus:border-ink disabled:opacity-50"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                type="email"
                disabled={isLoading}
                required
              />
            </label>
            <label className="block text-sm text-muted">
              Password
              <input
                className="mt-1 w-full rounded-xl border border-peach/50 bg-white px-3 py-2 text-ink outline-none focus:border-ink disabled:opacity-50"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                type="password"
                disabled={isLoading}
                required
              />
            </label>
            <button className="primary-btn w-full disabled:opacity-60" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleSignup}>
            <label className="block text-sm text-muted">
              Full name
              <input
                className="mt-1 w-full rounded-xl border border-peach/50 bg-white px-3 py-2 text-ink outline-none focus:border-ink disabled:opacity-50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </label>
            <label className="block text-sm text-muted">
              Email
              <input
                className="mt-1 w-full rounded-xl border border-peach/50 bg-white px-3 py-2 text-ink outline-none focus:border-ink disabled:opacity-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                disabled={isLoading}
                required
              />
            </label>
            <label className="block text-sm text-muted">
              Password
              <input
                className="mt-1 w-full rounded-xl border border-peach/50 bg-white px-3 py-2 text-ink outline-none focus:border-ink disabled:opacity-50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                disabled={isLoading}
                required
              />
            </label>
            <label className="block text-sm text-muted">
              Preferred persona
              <select
                className="mt-1 w-full rounded-xl border border-peach/50 bg-white px-3 py-2 text-ink outline-none focus:border-ink disabled:opacity-50"
                value={preferredPersona}
                onChange={(e) => setPreferredPersona(e.target.value)}
                disabled={isLoading}
              >
                {PERSONAS.map((persona) => (
                  <option key={persona} value={persona}>
                    {persona}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-btn w-full disabled:opacity-60" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}

        <div className="my-5 h-px bg-blush" />

        <button className="ghost-btn w-full disabled:opacity-50" onClick={enterGuest} disabled={isLoading}>
          Continue as guest
        </button>
      </section>
    </main>
  );
}
