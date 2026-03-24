import { useState, useRef, useEffect } from 'react';

const MessageActions = ({ onEdit, onDelete, onShare, isOwn, message }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    setDropUp(rect.bottom + 200 > window.innerHeight - 16);
    setAlignLeft(rect.left - 176 < 8);
  }, [showMenu]);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, []);

  const handleShare = async () => {
    setShowMenu(false);
    const text = message?.content || '';
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Share error:', err);
    }
    onShare?.();
  };

  if (!isOwn) return null;

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setShowMenu((v) => !v)}
        className={`p-1.5 rounded-xl transition-all duration-150 outline-none active:scale-90 ${
          showMenu
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        aria-label="Message actions"
        aria-expanded={showMenu}
      >
        <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {showMenu && (
        <div className={[
          'absolute z-50 w-44',
          'bg-white dark:bg-gray-900',
          'rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800',
          'py-1.5 overflow-hidden',
          dropUp ? 'bottom-full mb-2' : 'top-full mt-2',
          alignLeft ? 'left-0' : 'right-0',
        ].join(' ')}>

          <div className="px-3 pt-1.5 pb-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Actions</p>
          </div>

          {/* Edit */}
          <button
            onClick={() => { onEdit(); setShowMenu(false); }}
            className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all duration-150 flex items-center gap-2.5"
          >
            <span className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            Edit
          </button>

          {/* Share/Copy */}
          <button
            onClick={handleShare}
            className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 rounded-xl transition-all duration-150 flex items-center gap-2.5"
          >
            <span className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </span>
            Copy
          </button>

          <div className="h-px bg-gray-100 dark:bg-gray-800 mx-3 my-1" />

          {/* Delete */}
          <button
            onClick={() => { onDelete(); setShowMenu(false); }}
            className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-150 flex items-center gap-2.5"
          >
            <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageActions;