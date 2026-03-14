import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import MessageActions from './MessageActions';

const MessageBubble = ({ message, isOwn, onEdit, onDelete, onAddReaction }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');
  const [showPicker, setShowPicker] = useState(false);
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
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      window.open(url, '_blank');
    }
  };

  const renderContent = () => {
    if (message.type === 'deleted') {
      return (
        <div className="flex items-center gap-2 italic text-gray-400 dark:text-gray-500 text-xs py-1">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          This message was deleted
        </div>
      );
    }

    if (isEditing) {
      return (
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-2 min-w-[200px]">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-white/20 dark:bg-gray-900/40 border border-white/30 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-inherit focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
            rows="2"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] font-bold uppercase tracking-wider opacity-80 hover:opacity-100">Cancel</button>
            <button type="submit" className="bg-white text-blue-600 dark:bg-blue-500 dark:text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md active:scale-95 transition-all">Save</button>
          </div>
        </form>
      );
    }

    switch (message.type) {
      case 'image':
        return (
          <div className="relative group/img overflow-hidden rounded-xl border border-black/5 dark:border-white/5">
            {!imageLoaded && (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
            <img
              src={message.mediaUrl}
              alt="Shared image"
              className={`max-w-full max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onClick={() => window.open(message.mediaUrl, '_blank')}
              loading="lazy"
            />
            {imageLoaded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(message.mediaUrl, `img-${Date.now()}.jpg`);
                }}
                className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-xl backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-all duration-200 shadow-lg"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
            )}
          </div>
        );
      case 'file':
        return (
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${isOwn ? 'bg-white/10 border-white/20' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700'}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${isOwn ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => {
                  const filename = message.content?.replace(/[^a-z0-9.]/gi, '_') || 'file';
                  handleDownload(message.mediaUrl, filename);
                }}
                className={`text-sm font-bold truncate block w-full text-left hover:underline ${isOwn ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}
              >
                {message.content || 'Attached File'}
              </button>
              <p className={`text-[10px] uppercase font-black tracking-widest mt-0.5 opacity-60 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.mediaUrl?.split('.').pop() || 'FILE'}
              </p>
            </div>
          </div>
        );
      default:
        return (
          <p className="leading-relaxed text-sm sm:text-[15px] font-medium tracking-tight">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div className={`flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`relative flex flex-col max-w-[85%] sm:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Sender Label */}
        {!isOwn && message.sender?.username && (
          <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-1 ml-2">
            {message.sender.username}
          </span>
        )}

        {/* Bubble Container */}
        <div className="relative flex items-center gap-2 group">
          
          <div
            className={`
              relative px-4 py-3 rounded-[1.5rem] shadow-sm transition-all duration-300
              ${isOwn 
                ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-none border-b border-blue-400 shadow-blue-500/10' 
                : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-tl-none shadow-black/5'
              }
            `}
          >
            {renderContent()}

            {/* Meta Info */}
            <div className={`flex items-center gap-1.5 mt-1.5 text-[9px] font-bold uppercase tracking-tighter opacity-60 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: false })}</span>
              {message.edited && <span className="italic font-black text-blue-200">• Edited</span>}
              {isOwn && (
                <span className={`text-[12px] ${message.readBy?.length ? 'text-blue-200' : 'text-white/60'}`}>
                  {message.readBy?.length ? '◈◈' : '◈'}
                </span>
              )}
            </div>
          </div>

          {/* Inline Action Buttons (Hover) */}
          {!isEditing && message.type !== 'deleted' && (
            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform ${isOwn ? 'flex-row-reverse -translate-x-2' : 'translate-x-2'}`}>
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
              >
                <span className="text-sm">😊</span>
              </button>
              {isOwn && (
                <div className="bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
                  <MessageActions
                    onEdit={() => setIsEditing(true)}
                    onDelete={() => onDelete(message._id)}
                    isOwn={isOwn}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reaction Bar */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onAddReaction(message._id, emoji)}
                className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-full text-xs shadow-sm hover:border-blue-400 transition-all transform hover:scale-105 active:scale-95"
              >
                <span>{emoji}</span>
                <span className="font-black text-[10px] text-gray-500">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Emoji Picker Modal */}
        {showPicker && (
          <div className={`absolute bottom-full mb-3 z-[60] shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${isOwn ? 'right-0' : 'left-0'}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-3xl" />
              <Picker
                data={data}
                onEmojiSelect={(emoji) => {
                  onAddReaction(message._id, emoji.native);
                  setShowPicker(false);
                }}
                theme="auto"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>
            <div className="fixed inset-0 z-[-1]" onClick={() => setShowPicker(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;