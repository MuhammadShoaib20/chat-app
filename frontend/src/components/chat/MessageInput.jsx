import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { uploadFile } from '../../services/uploadService';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const MessageInput = ({ onSend, conversationId, disabled }) => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket } = useSocket();
  const { darkMode } = useTheme();

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        socket?.emit('typing-stop', { conversationId });
      }
    };
  }, [conversationId, socket]);

  // Auto‑grow textarea
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  // Handle input change with typing indicator
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

  // Emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    setTimeout(() => adjustHeight(), 0);
  };

  // File attachment
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;
    setUploading(true);
    try {
      const { url, originalName } = await uploadFile(file);
      const isImage = file.type.startsWith('image/');
      onSend(isImage ? '🖼️ Image' : `📎 ${originalName}`, isImage ? 'image' : 'file', url);
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Send message
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

  return (
    <div className="p-3 md:p-4 bg-white dark:bg-gray-950 relative">
      
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Picker 
            data={data} 
            onEmojiSelect={handleEmojiSelect} 
            theme={darkMode ? 'dark' : 'light'}
            previewPosition="none"
          />
          <div className="fixed inset-0 z-[-1]" onClick={() => setShowEmojiPicker(false)} />
        </div>
      )}

      <div className={`max-w-4xl mx-auto transition-all duration-300 border rounded-[28px] p-1.5 ${
        isFocused 
          ? 'border-blue-500/30 bg-white dark:bg-gray-900 shadow-xl shadow-blue-500/5' 
          : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50'
      }`}>
        
        {/* Input Area */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Type a message..."
          rows={1}
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none outline-none text-[15px] md:text-base text-gray-800 dark:text-gray-100 px-4 pt-3 pb-1 min-h-[45px] max-h-40 custom-scrollbar"
          disabled={disabled}
        />

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between px-2 pb-1.5">
          <div className="flex items-center gap-1">
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all active:scale-90"
              aria-label="Open emoji picker"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Attachment Button */}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all active:scale-90"
              aria-label="Attach file"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!message.trim() || uploading || disabled}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
              message.trim() 
                ? 'bg-blue-600 text-white shadow-lg active:scale-90' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className={message.trim() ? "translate-x-0.5" : ""}>
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;