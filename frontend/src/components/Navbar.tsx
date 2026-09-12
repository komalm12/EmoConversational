import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Profile', path: '/profile' },
  { label: 'Chat', path: '/chat/mom' },
  { label: 'Summary', path: '/summary' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/chat/mom') return location.pathname.startsWith('/chat');
    return location.pathname.startsWith(path);
  };

  const profileRaw = localStorage.getItem('ec_user_profile');
  const profileName = profileRaw ? JSON.parse(profileRaw)?.name : 'User';

  const handleSignOut = () => {
    localStorage.removeItem('ec_token');
    localStorage.removeItem('ec_active_user_email');
    localStorage.removeItem('ec_user_profile');
    sessionStorage.removeItem('ec_anon_id');
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-cream/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-ink shadow-sm"
        >
          CEA-AI
        </button>

        <div className="hidden items-center gap-2 rounded-full border border-white/60 bg-white/70 p-1 sm:flex">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active ? 'bg-ink text-white' : 'text-muted hover:bg-cream hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-white/70 px-3 py-1 text-xs text-muted sm:inline">
            {profileName || 'User'}
          </span>
          <button onClick={handleSignOut} className="ghost-btn !px-4 !py-2">
            Sign out
          </button>
        </div>
      </nav>
    </header>
  );
}
