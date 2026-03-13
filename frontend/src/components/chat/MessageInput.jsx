import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../context/ThemeContext';
import { uploadFile } from '../../services/uploadService';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const MessageInput = ({ onSend, conversationId, disabled }) => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket } = useSocket();
  const { darkMode } = useTheme();

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    adjustHeight();

    if (!conversationId || disabled) return;
    socket?.emit('typing-start', { conversationId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('typing-stop', { conversationId });
    }, 2000);
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    adjustHeight();
    setShowEmojiPicker(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || disabled) return;

    setUploading(true);
    try {
      const { url, originalName } = await uploadFile(file);
      const isImage = file.type.startsWith('image/');
      onSend(isImage ? '🖼️ Image' : `📎 ${originalName}`, isImage ? 'image' : 'file', url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && conversationId && !disabled) {
      onSend(message, 'text', '');
      setMessage('');
      adjustHeight();
      setShowEmojiPicker(false);
      socket?.emit('typing-stop', { conversationId });
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        socket?.emit('typing-stop', { conversationId });
      }
    };
  }, [conversationId, socket]);

  return (
    <div className="relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-2 mb-2 z-50 max-w-[90vw] sm:max-w-[350px]">
          <div className="shadow-xl rounded-lg">
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme={darkMode ? 'dark' : 'light'}
              previewPosition="none"
              skinTonePosition="none"
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload button with SVG icon */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="p-2.5 w-11 h-11 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Attach file"
        >
          {uploading ? (
            <svg className="animate-spin h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          )}
        </button>

        {/* Emoji button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          className="p-2.5 w-11 h-11 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Add emoji"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>

        {/* Textarea with shadow */}
        <div className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 shadow-inner">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
            placeholder={disabled ? 'Messaging unavailable' : 'Type a message...'}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent resize-none outline-none max-h-32 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled || uploading}
          className="h-11 px-5 flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-full hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default MessageInput;