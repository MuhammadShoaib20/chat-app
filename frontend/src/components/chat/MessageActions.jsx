import { useState, useRef, useEffect } from 'react';

const MessageActions = ({ onEdit, onDelete, onShare, isOwn, message }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const menuRef = useRef(null);

  // Smart positioning — recalculate every time menu opens
  useEffect(() => {
    if (!showMenu || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const DROPDOWN_H = 200;
    const DROPDOWN_W = 176;
    // Open upward if less than DROPDOWN_H space below
    setDropUp(rect.bottom + DROPDOWN_H > window.innerHeight - 16);
    // Align to left edge of trigger if dropdown would overflow right side
    // But since our bubbles are already near right edge on mobile,
    // check if aligning right (default) would cut off on LEFT side
    setAlignLeft(rect.left - DROPDOWN_W < 8);
  }, [showMenu]);

  // Close on outside click / touch
  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
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
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.error('Error sharing message:', err);
    }
    onShare?.();
  };

  if (!isOwn) return null;

  return (
    <div className="relative inline-block leading-none" ref={menuRef}>

      {/* Trigger */}
      <button
        onClick={() => setShowMenu((v) => !v)}
        className={`p-1.5 rounded-xl transition-all duration-200 outline-none active:scale-90 touch-manipulation select-none ${
          showMenu
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-inner'
            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        aria-label="Message actions"
        aria-expanded={showMenu}
        aria-haspopup="true"
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5"  r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {/* Dropdown */}
      {showMenu && (
        <>
          {/* Full-screen backdrop — catches taps outside on mobile */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
            onTouchStart={() => setShowMenu(false)}
            aria-hidden="true"
          />

          <div
            className={[
              'absolute z-50 w-44',
              'bg-white/95 dark:bg-gray-900/98 backdrop-blur-xl',
              'rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800',
              'py-1.5',
              'animate-in fade-in zoom-in-95 duration-150',
              dropUp
                ? 'bottom-full mb-2 origin-bottom-right'
                : 'top-full mt-2 origin-top-right',
              alignLeft ? 'left-0' : 'right-0',
            ].join(' ')}
          >
            {/* Section label */}
            <div className="px-3 py-1.5 mb-0.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Actions
              </p>
            </div>

            {/* Edit */}
            <button
              onClick={() => { onEdit(); setShowMenu(false); }}
              className="w-[calc(100%-12px)] mx-1.5 text-left px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all flex items-center gap-2.5 group touch-manipulation"
            >
              <span className="p-1 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors flex-shrink-0">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </span>
              Edit
            </button>

            {/* Share / Copy */}
            <button
              onClick={handleShare}
              className="w-[calc(100%-12px)] mx-1.5 text-left px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 rounded-xl transition-all flex items-center gap-2.5 group touch-manipulation"
            >
              <span className="p-1 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors flex-shrink-0">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </span>
              Share
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-3" />

            {/* Delete */}
            <button
              onClick={() => { onDelete(); setShowMenu(false); }}
              className="w-[calc(100%-12px)] mx-1.5 text-left px-3 py-2.5 text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center gap-2.5 group touch-manipulation"
            >
              <span className="p-1 rounded-lg bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-800/60 transition-colors flex-shrink-0">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </span>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageActions;