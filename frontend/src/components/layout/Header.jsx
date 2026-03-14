import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

const Header = () => {
  const { user, setUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Chat', path: '/chat' },
    ...(user ? [{ name: 'Profile', path: '/profile' }] : []),
  ];

  return (
    <header className="sticky top-0 z-[100] bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo - Compact for Mobile */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
              Sync<span className="text-blue-600">Chat</span>
            </span>
          </Link>

          {/* Desktop Nav - Centered */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/40 p-1 rounded-xl">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                    isActive ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Theme Toggle - Smaller on mobile */}
            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 active:scale-90 transition-transform"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* User Section / Auth */}
            <div className="hidden sm:flex items-center gap-3 ml-2 border-l border-gray-200 dark:border-gray-800 pl-4">
              {user ? (
                <>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">@{user.username}</span>
                  <button onClick={handleLogout} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all">Logout</button>
                </>
              ) : (
                <Link to="/login" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white rounded-lg">Login</Link>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 8h16M4 16h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown - Optimized for Login State */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-[400px] border-t border-gray-100 dark:border-gray-800 py-4' : 'max-h-0'}`}>
          <div className="flex flex-col gap-2">
            {user && (
              <div className="px-3 py-2 mb-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex items-center justify-between">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Hi, {user.username}</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            )}
            
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl ${
                  location.pathname === link.path ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {user ? (
              <button
                onClick={handleLogout}
                className="mt-2 w-full px-4 py-3 text-xs font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-left"
              >
                Logout Account
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 w-full px-4 py-3 text-xs font-black uppercase tracking-widest bg-blue-600 text-white rounded-xl text-center"
              >
                Login to SyncChat
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;