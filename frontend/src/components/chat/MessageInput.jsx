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
    setTimeout(adjustHeight, 0);
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
      onSend(message, 'text', '');
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

  return (
    <div className="relative p-3 sm:p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800">
      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-4 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-2xl rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
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

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto flex items-end gap-2 sm:gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {/* Action Buttons Group */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all active:scale-90 disabled:opacity-50"
            title="Attach file"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${
              showEmojiPicker 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600'
            }`}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>
        </div>

        {/* Text Area Container */}
        <div className={`flex-1 relative flex items-center min-w-0 rounded-[1.5rem] px-4 py-2.5 transition-all duration-300 border-2 ${
          disabled 
            ? 'bg-gray-50 dark:bg-gray-900 border-transparent' 
            : 'bg-gray-50 dark:bg-gray-900 border-transparent focus-within:border-blue-500/30 focus-within:bg-white dark:focus-within:bg-gray-950 shadow-inner'
        }`}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
            placeholder={disabled ? 'Chat is disabled' : 'Write something...'}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent resize-none outline-none max-h-40 text-[15px] leading-relaxed text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 custom-scrollbar py-1"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled || uploading}
          className="h-12 w-12 sm:w-auto sm:px-6 flex-shrink-0 flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-[11px] rounded-[1.25rem] shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-0 disabled:scale-90 disabled:pointer-events-none"
        >
          <span className="hidden sm:block">Send</span>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="transform rotate-45 -translate-y-0.5">
            <path d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;