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
    <header className="sticky top-0 z-[100] bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
              Sync<span className="text-blue-600 dark:text-blue-400">Chat</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all active:scale-90"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>

            {/* Auth section */}
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-black uppercase tracking-tighter text-gray-900 dark:text-white leading-none">
                    {user.username}
                  </span>
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Online</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 text-[11px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Join Now
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all active:scale-90"
            >
              <div className="relative w-5 h-4">
                <span className={`absolute h-0.5 w-full bg-current rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 top-1.5' : 'top-0'}`} />
                <span className={`absolute h-0.5 w-full bg-current rounded-full top-1.5 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
                <span className={`absolute h-0.5 w-full bg-current rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 top-1.5' : 'top-3'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100 py-6' : 'max-h-0 opacity-0'}`}>
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-4 text-sm font-black uppercase tracking-[0.2em] rounded-2xl transition-all ${
                  location.pathname === link.path 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {!user && (
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="py-4 text-center text-xs font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 rounded-2xl">Login</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="py-4 text-center text-xs font-black uppercase tracking-widest bg-blue-600 text-white rounded-2xl shadow-lg">Register</Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;