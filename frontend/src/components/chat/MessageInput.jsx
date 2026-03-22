import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../context/ThemeContext';
import { uploadFile } from '../../services/uploadService';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import toast from 'react-hot-toast';

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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
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
    setTimeout(adjustHeight, 0);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || disabled) return;

    setUploading(true);
    try {
      const { url, originalName } = await uploadFile(file);
      const isImage = file.type.startsWith('image/');
      onSend(isImage ? '🖼️ Image' : `📎 ${originalName}`, isImage ? 'image' : 'file', url);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && conversationId && !disabled) {
      onSend(message.trim(), 'text', '');
      setMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
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

  const canSend = message.trim() && !disabled && !uploading;

  return (
    <div className="flex-shrink-0 relative p-3 md:p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800">

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-3 md:left-4 mb-3 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-2xl rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme={darkMode ? 'dark' : 'light'}
            previewPosition="none"
            skinTonePosition="none"
          />
          <div className="fixed inset-0 z-[-1]" onClick={() => setShowEmojiPicker(false)} />
        </div>
      )}

      <div className="max-w-7xl mx-auto flex items-end gap-2 md:gap-2.5">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
          aria-hidden="true"
        />

        {/* Left action buttons */}
        <div className="flex items-center gap-1 mb-0.5 flex-shrink-0">
          {/* Attach */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-90 disabled:opacity-40"
            title="Attach file"
            aria-label="Attach file"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            )}
          </button>

          {/* Emoji */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${
              showEmojiPicker
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            aria-label="Toggle emoji picker"
          >
            <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" strokeWidth="3" />
              <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" strokeWidth="3" />
            </svg>
          </button>
        </div>

        {/* Text input */}
        <div className={`flex-1 relative flex items-center min-w-0 rounded-2xl px-4 py-2.5 transition-all duration-200 border-2 ${
          disabled
            ? 'bg-gray-50 dark:bg-gray-900 border-transparent opacity-60'
            : 'bg-gray-50 dark:bg-gray-900 border-transparent focus-within:border-blue-500/25 focus-within:bg-white dark:focus-within:bg-gray-950'
        }`}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={disabled ? 'Chat is disabled' : 'Write something...'}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent resize-none outline-none max-h-40 text-sm md:text-[15px] leading-relaxed text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 custom-scrollbar py-0.5"
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className={`h-11 w-11 md:w-auto md:px-5 flex-shrink-0 flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg shadow-blue-500/20 transition-all ${
            canSend
              ? 'hover:scale-105 active:scale-95 opacity-100'
              : 'opacity-0 scale-90 pointer-events-none'
          }`}
          aria-label="Send message"
        >
          <span className="hidden md:block">Send</span>
          <svg
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
            style={{ transform: 'rotate(45deg) translateY(-1px)' }}
          >
            <path d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;