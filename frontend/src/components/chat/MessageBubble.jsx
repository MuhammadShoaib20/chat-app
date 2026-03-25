import { useState, useMemo, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import MessageActions from './MessageActions';

const MessageBubble = memo(({ message, isOwn, onEdit, onDelete, onAddReaction, showAvatar }) => {
  const [isEditing, setIsEditing] = useState(false);

  const reactionCounts = useMemo(() => {
    return message.reactions?.reduce((acc, { emoji }) => {
      acc[emoji] = (acc[emoji] || 0) + 1;
      return acc;
    }, {}) || {};
  }, [message.reactions]);

  const handleEditSave = (newText) => {
    if (newText.trim() && newText !== message.content) {
      onEdit(message._id, newText);
    }
    setIsEditing(false);
  };

  return (
    <div className={`flex w-full mb-4 animate-fadeIn ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex flex-col max-w-[75%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {showAvatar && message.sender?.username && !isOwn && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 ml-2">
            {message.sender.username}
          </span>
        )}

        <MessageActions 
          message={message} 
          isOwn={isOwn} 
          onEdit={() => setIsEditing(true)} 
          onDelete={() => onDelete(message._id)} 
          onReaction={(emoji) => onAddReaction(message._id, emoji)}
        >
          <div className={`relative px-4 py-3 rounded-[1.2rem] shadow-sm transition-all ${
            isOwn ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-700'
          }`}>
            {isEditing ? (
              <div className="flex flex-col gap-2 min-w-[200px]">
                <textarea 
                  autoFocus
                  className="w-full bg-black/10 rounded-lg p-2 text-sm outline-none border border-white/20"
                  defaultValue={message.content}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { handleEditSave(e.target.value); }
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  onBlur={(e) => handleEditSave(e.target.value)}
                />
                <p className="text-[9px] opacity-70 italic">Press Enter to save, Esc to cancel</p>
              </div>
            ) : (
              <p className="text-sm font-medium break-words whitespace-pre-wrap">{message.content}</p>
            )}

            <div className={`flex items-center gap-1 mt-1 text-[9px] font-bold opacity-60 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
              {message.edited && <span>· edited</span>}
              {isOwn && <span className={message.readBy?.length ? 'text-blue-200' : 'text-white/40'}>{message.readBy?.length ? '✓✓' : '✓'}</span>}
            </div>
          </div>
        </MessageActions>

        {/* Reactions List */}
       {/* Reactions List - Increased Size & Better Styling */}
{Object.keys(reactionCounts).length > 0 && (
  <div className={`flex flex-wrap gap-1.5 -mt-3 z-10 mb-1 ${isOwn ? 'mr-3' : 'ml-3'}`}>
    {Object.entries(reactionCounts).map(([emoji, count]) => (
      <button
        key={emoji}
        onClick={() => onAddReaction(message._id, emoji)}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all duration-150 group/reaction"
      >
        {/* Emoji ka size yahan se control ho raha hai (text-base = 16px) */}
        <span className="text-base sm:text-lg leading-none select-none">
          {emoji}
        </span>
        
        {/* Count ka size aur weight */}
        {count > 1 && (
          <span className="text-[11px] font-black text-gray-500 dark:text-gray-300">
            {count}
          </span>
        )}
      </button>
    ))}
  </div>
)}
      </div>
    </div>
  );
});

export default MessageBubble;