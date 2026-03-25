import { useState, useRef, useEffect, memo } from 'react';
import EmojiPicker from 'emoji-picker-react';

const MessageActions = memo(({ onEdit, onDelete, onReaction, isOwn, message, children }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const quickEmojis = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

  // Handle Click Outside
  useEffect(() => {
    const closeAll = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && 
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowFullPicker(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', closeAll);
    return () => document.removeEventListener('mousedown', closeAll);
  }, [showMenu]);

  // Position Logic
  useEffect(() => {
    if (showMenu && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < (showFullPicker ? 450 : 250));
    }
  }, [showMenu, showFullPicker]);

  const handleEmojiSelect = (emojiData) => {
    onReaction?.(emojiData.emoji || emojiData);
    setShowMenu(false);
    setShowFullPicker(false);
  };

  return (
    <div className="relative group flex items-center">
      {/* 3-Dot Button: Message ke side mein show hoga center par */}
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
        className={`absolute z-20 p-1 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100 ${
          showMenu ? 'opacity-100 rotate-90 scale-110' : ''
        } ${isOwn ? '-left-8' : '-right-8'}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {/* Message Content */}
      {children}

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className={`absolute z-[100] min-w-[240px] transition-all duration-200 ${
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${isOwn ? 'right-0' : 'left-0'}`}
        >
          {!showFullPicker ? (
            <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {/* Quick Emojis */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-white/5 border-b dark:border-gray-800">
                {quickEmojis.map((emoji) => (
                  <button key={emoji} onClick={() => handleEmojiSelect(emoji)} className="text-2xl hover:scale-125 transition-transform active:scale-90">{emoji}</button>
                ))}
                <button onClick={() => setShowFullPicker(true)} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl hover:bg-blue-500 hover:text-white transition-colors">+</button>
              </div>

              {/* Actions */}
              <div className="p-1.5 space-y-0.5">
                <button onClick={() => { navigator.clipboard.writeText(message?.content); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">Copy</button>
                {isOwn && (
                  <>
                    <button onClick={() => { onEdit(); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl">Edit</button>
                    <div className="h-px bg-gray-100 dark:border-gray-800 my-1 mx-2" />
                    <button onClick={() => { onDelete(); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">Delete</button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="shadow-2xl rounded-2xl overflow-hidden border dark:border-gray-700">
              <EmojiPicker onEmojiClick={handleEmojiSelect} theme="auto" width={300} height={400} skinTonesDisabled={true} searchDisabled={false} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default MessageActions;