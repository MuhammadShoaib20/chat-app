import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import MessageActions from './MessageActions';

const MessageBubble = ({ message, isOwn, onEdit, onDelete, onAddReaction, showAvatar }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');
  const [showPicker, setShowPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const reactionCounts = message.reactions?.reduce((acc, { emoji }) => {
    acc[emoji] = (acc[emoji] || 0) + 1;
    return acc;
  }, {}) || {};

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editText.trim() && editText !== message.content) {
      onEdit(message._id, editText);
      setIsEditing(false);
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const renderContent = () => {
    if (message.type === 'deleted') {
      return (
        <div className="flex items-center gap-1.5 italic text-xs opacity-60 py-0.5">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" strokeLinecap="round" />
          </svg>
          This message was deleted
        </div>
      );
    }

    if (isEditing) {
      return (
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-2 min-w-[180px]">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-inherit focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
            rows={2}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] font-bold uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity">Cancel</button>
            <button type="submit" className="bg-white/90 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow active:scale-95 transition-all">Save</button>
          </div>
        </form>
      );
    }

    switch (message.type) {
      case 'image':
        return (
          <div className="relative group/img overflow-hidden rounded-xl">
            {!imageLoaded && (
              <div className="w-full h-44 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center rounded-xl">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )}
            <img
              src={message.mediaUrl}
              alt="Shared image"
              className={`max-w-full max-h-64 object-cover cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-xl ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
              onLoad={() => setImageLoaded(true)}
              onClick={() => window.open(message.mediaUrl, '_blank')}
              loading="lazy"
            />
            {imageLoaded && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(message.mediaUrl, `img-${Date.now()}.jpg`); }}
                className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-lg backdrop-blur opacity-0 group-hover/img:opacity-100 transition-all duration-200"
                aria-label="Download"
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </div>
        );

      case 'file':
        return (
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${isOwn ? 'bg-white/10 border-white/20' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOwn ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => handleDownload(message.mediaUrl, message.content || 'file')}
                className={`text-sm font-semibold truncate block w-full text-left hover:underline ${isOwn ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}
              >
                {message.content || 'Attached File'}
              </button>
              <p className="text-[10px] uppercase font-bold tracking-wider mt-0.5 opacity-50">
                {message.mediaUrl?.split('.').pop() || 'FILE'}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <p className="leading-relaxed text-sm font-medium break-words whitespace-pre-wrap">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div className={`flex w-full mb-2 ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`relative flex flex-col max-w-[80%] sm:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Sender name in group chats */}
        {showAvatar && message.sender?.username && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 ml-1">
            {message.sender.username}
          </span>
        )}

        {/* Bubble */}
        <div className="relative">
          <div className={`relative px-4 py-3 rounded-[1.35rem] shadow-sm transition-all duration-200 ${
            isOwn
              ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-md shadow-blue-500/15'
              : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-tl-md shadow-black/5'
          }`}>
            {renderContent()}

            {/* Timestamp */}
            <div className={`flex items-center gap-1 mt-1.5 text-[9px] font-semibold uppercase tracking-wider opacity-55 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: false })}</span>
              {message.edited && <span className="italic">· edited</span>}
              {isOwn && (
                <span className={`text-[11px] leading-none ${message.readBy?.length ? 'text-blue-200' : 'text-white/40'}`}>
                  {message.readBy?.length ? '✓✓' : '✓'}
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          {!isEditing && message.type !== 'deleted' && isOwn && (
            <div className="absolute -top-2 -right-2 z-20">
              <button
                onClick={() => setShowActions(!showActions)}
                className="w-6 h-6 bg-white dark:bg-gray-700 rounded-full shadow-md border border-gray-100 dark:border-gray-600 flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-150 opacity-0 group-hover:opacity-100"
                aria-label="Message actions"
              >
                <svg width="12" height="12" fill="currentColor" className="text-gray-500 dark:text-gray-300" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                </svg>
              </button>
            </div>
          )}

          {/* Dropdown */}
          {showActions && isOwn && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
              <div className="absolute z-50 right-0 top-full mt-1">
                <MessageActions
                  onEdit={() => { setIsEditing(true); setShowActions(false); }}
                  onDelete={() => { onDelete(message._id); setShowActions(false); }}
                  isOwn={isOwn}
                  message={message}
                />
              </div>
            </>
          )}
        </div>

        {/* Reactions */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onAddReaction(message._id, emoji)}
                className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full text-xs shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:scale-105 active:scale-95"
              >
                <span>{emoji}</span>
                <span className="font-bold text-[10px] text-gray-500 dark:text-gray-400">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Emoji picker */}
        {showPicker && (
          <div className={`absolute bottom-full mb-2 z-[60] shadow-2xl ${isOwn ? 'right-0' : 'left-0'}`}>
            <Picker
              data={data}
              onEmojiSelect={(emoji) => { onAddReaction(message._id, emoji.native); setShowPicker(false); }}
              theme="auto"
              previewPosition="none"
              skinTonePosition="none"
            />
            <div className="fixed inset-0 z-[-1]" onClick={() => setShowPicker(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;