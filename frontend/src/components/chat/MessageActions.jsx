import { useState, useRef, useEffect } from 'react';

const MessageActions = ({ onEdit, onDelete, isOwn }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOwn) return null;

  return (
    <div className="relative inline-block leading-none" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-1.5 rounded-xl transition-all duration-200 outline-none active:scale-90 ${
          showMenu 
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shadow-inner' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
        }`}
        aria-label="Message actions"
        aria-expanded={showMenu}
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-40 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-1.5 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 origin-top-right">
          {/* Label for context */}
          <div className="px-3 py-1.5 mb-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Actions</p>
          </div>

          <button
            onClick={() => {
              onEdit();
              setShowMenu(false);
            }}
            className="w-[calc(100%-12px)] mx-1.5 text-left px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all flex items-center gap-2.5 group"
          >
            <div className="p-1 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            Edit
          </button>

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-3" />

          <button
            onClick={() => {
              onDelete();
              setShowMenu(false);
            }}
            className="w-[calc(100%-12px)] mx-1.5 text-left px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center gap-2.5 group"
          >
            <div className="p-1 rounded-lg bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-800 transition-colors">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageActions;