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
        <div className="italic text-gray-500 dark:text-gray-400 text-xs py-0.5">
          This message was deleted
        </div>
      );
    }

    if (isEditing) {
      return (
        <form onSubmit={handleEditSubmit} className="flex items-center gap-1">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-2 py-1 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </form>
      );
    }

    switch (message.type) {
      case 'image':
        return (
          <div className="relative">
            {!imageLoaded && (
              <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
            )}
            <img
              src={message.mediaUrl}
              alt="Shared image"
              className={`max-w-full max-h-48 rounded-lg cursor-pointer transition-opacity duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onClick={() => window.open(message.mediaUrl, '_blank')}
              loading="lazy"
            />
            {imageLoaded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(message.mediaUrl, `image-${Date.now()}.jpg`);
                }}
                className="absolute bottom-1 right-1 bg-black/50 hover:bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full backdrop-blur-sm transition-colors"
                title="Download"
              >
                ⬇️
              </button>
            )}
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <span className="text-xl">📎</span>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => {
                  const filename = message.content?.replace(/[^a-z0-9.]/gi, '_') || 'file';
                  handleDownload(message.mediaUrl, filename);
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline text-left break-all text-xs font-medium"
              >
                {message.content || 'Download file'}
              </button>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                {message.content?.startsWith('📎') ? message.content.slice(2) : 'File'}
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="break-words whitespace-pre-wrap text-xs sm:text-sm">
            {message.content}
          </div>
        );
    }
  };

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
    >
      <div className={`relative max-w-[75%] sm:max-w-[65%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Sender name (only for groups) */}
        {!isOwn && message.sender?.username && (
          <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5 ml-1">
            {message.sender.username}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`
            p-2 rounded-lg shadow-sm break-words
            ${
              isOwn
                ? 'bg-blue-500   text-white rounded-br-none'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-bl-none'
            }
          `}
        >
          {renderContent()}

          {/* Timestamp and read receipt */}
          <div className="flex items-center justify-end gap-1 mt-0.5 text-[8px] sm:text-[10px] opacity-70">
            <span>
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
            {message.edited && <span className="ml-1 italic">(edited)</span>}
            {isOwn && (
              <span className="ml-1">
                {message.readBy?.length ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-0.5 justify-end">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onAddReaction(message._id, emoji)}
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {!isEditing && message.type !== 'deleted' && (
          <div
            className={`
              absolute bottom-0 ${isOwn ? 'left-0 -translate-x-full pl-1' : 'right-0 translate-x-full pr-1'}
              flex items-center gap-0.5
              md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200
            `}
          >
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              title="Add reaction"
            >
              <span className="text-xs">😊</span>
            </button>

            {isOwn && (
              <MessageActions
                onEdit={() => setIsEditing(true)}
                onDelete={() => onDelete(message._id)}
                isOwn={isOwn}
              />
            )}
          </div>
        )}

        {/* Emoji picker */}
        {showPicker && (
          <div
            className={`
              absolute bottom-full mb-1 z-50
              ${isOwn ? 'right-0' : 'left-0'}
              max-w-[90vw] sm:max-w-[300px]
            `}
          >
            <Picker
              data={data}
              onEmojiSelect={(emoji) => {
                onAddReaction(message._id, emoji.native);
                setShowPicker(false);
              }}
              theme="light"
              previewPosition="none"
              skinTonePosition="none"
              className="rounded-lg shadow-xl scale-75 sm:scale-90 origin-bottom-right"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;