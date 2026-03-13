import { useState, useEffect, useRef, useCallback } from 'react';
import { getMessages, markAsRead, searchMessages } from '../../services/messageService';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import Skeleton from 'react-loading-skeleton';
import { blockUser, getBlockStatus, unblockUser } from '../../services/userService';

// Helper to format date headers
const formatDateHeader = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const ChatWindow = ({
  conversationId,
  conversation,
  onStartCall,
  onOpenInfo,
  onOpenSidebar, // for mobile back button
}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [blockStatus, setBlockStatus] = useState({ hasBlocked: false, isBlockedBy: false });
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { socket, onlineUsers } = useSocket();
  const { user } = useAuth();

  const otherParticipant = conversation?.participants?.find(p => p.userId?._id !== user?._id);
  const otherUserId = otherParticipant?.userId?._id;
  const isOnline = otherUserId ? onlineUsers.includes(otherUserId) : false;

  // Fetch block status if one‑to‑one
  useEffect(() => {
    if (!otherUserId || conversation?.isGroup) return;
    getBlockStatus(otherUserId)
      .then(setBlockStatus)
      .catch((e) => console.error('Failed to load block status:', e));
  }, [otherUserId, conversation?.isGroup]);

  const fetchMessages = useCallback(async (pageNum, isInitial = false) => {
    if (!conversationId) return;
    if (isInitial) setLoadingInitial(true);
    else setLoading(true);
    try {
      const data = await getMessages(conversationId, pageNum);
      if (isInitial) {
        setMessages(data.messages || []);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        setMessages(prev => [...(data.messages || []), ...prev]);
        // Preserve scroll position after loading older messages
        const container = messagesContainerRef.current;
        if (container) {
          const oldScrollHeight = container.scrollHeight;
          setTimeout(() => {
            container.scrollTop = container.scrollHeight - oldScrollHeight;
          }, 0);
        }
      }
      setHasMore(pageNum < data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      if (isInitial) setLoadingInitial(false);
      else setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      setMessages([]);
      fetchMessages(1, true);
      socket?.emit('join-conversation', conversationId);
      return () => socket?.emit('leave-conversation', conversationId);
    }
  }, [conversationId, socket, fetchMessages]);

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Auto-scroll to bottom on new messages (if user is near bottom)
  useEffect(() => {
    if (!messages.length) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom) {
      setTimeout(() => scrollToBottom(true), 50);
    }
  }, [messages]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (String(msg.conversation) === String(conversationId)) {
        setMessages(prev => [...prev, msg]);
        // Will auto-scroll if near bottom (handled by above effect)
      }
    };

    const handleMessageUpdated = (updatedMsg) => {
      setMessages(prev => prev.map(m => (m._id === updatedMsg._id ? updatedMsg : m)));
    };

    const handleMessagesRead = ({ userId, messageIds, conversationId: convId }) => {
      if (String(convId) !== String(conversationId)) return;
      setMessages(prev =>
        prev.map(m =>
          messageIds.includes(m._id)
            ? { ...m, readBy: Array.from(new Set([...(m.readBy || []), userId])) }
            : m
        )
      );
    };

    const handleUserTyping = ({ userId, username }) => {
      if (userId === user?._id) return;
      setTypingUsers(prev => {
        if (prev.some(u => u.userId === userId)) return prev;
        return [...prev, { userId, username }];
      });
    };

    const handleUserStoppedTyping = ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-updated', handleMessageUpdated);
    socket.on('messages-read', handleMessagesRead);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stopped-typing', handleUserStoppedTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-updated', handleMessageUpdated);
      socket.off('messages-read', handleMessagesRead);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stopped-typing', handleUserStoppedTyping);
    };
  }, [socket, conversationId, user?._id]);

  // Mark messages as read when visible
  useEffect(() => {
    if (!conversationId || !user?._id) return;
    if (!messages.length) return;

    const unread = messages.filter(
      (m) => m?.sender?._id !== user._id && !(m.readBy || []).includes(user._id)
    );
    if (!unread.length) return;

    const messageIds = unread.map((m) => m._id);
    markAsRead({ conversationId, messageIds }).catch((e) => {
      console.error('Failed to mark as read:', e);
    });
  }, [conversationId, user?._id, messages]);

  // Group messages by date for separators
  const messagesWithDateHeaders = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt);
    const dateStr = msgDate.toDateString();
    if (dateStr !== lastDate) {
      messagesWithDateHeaders.push({ type: 'date', date: msgDate });
      lastDate = dateStr;
    }
    messagesWithDateHeaders.push({ type: 'message', message: msg });
  });

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 p-4 text-center">
        Select a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header – refined with subtle shadow */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 gap-2 flex-wrap bg-white dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center min-w-0 flex-1">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="lg:hidden mr-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Back to chats"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="truncate">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              {conversation?.name || otherParticipant?.userId?.username}
            </h2>
            {!conversation?.isGroup && (
              <p className={`text-xs sm:text-sm ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                {isOnline ? '● Online' : '○ Offline'}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons – smoother hover */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-gray-600 dark:text-gray-300 active:scale-95"
            title="Search"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>

          {!conversation?.isGroup && otherParticipant && (
            <>
              <button
                onClick={async () => {
                  try {
                    if (blockStatus.hasBlocked) {
                      await unblockUser(otherUserId);
                      setBlockStatus({ ...blockStatus, hasBlocked: false });
                    } else {
                      await blockUser(otherUserId);
                      setBlockStatus({ ...blockStatus, hasBlocked: true });
                    }
                  } catch (e) {
                    console.error('Block/unblock failed:', e);
                  }
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-gray-600 dark:text-gray-300 active:scale-95"
                title={blockStatus.hasBlocked ? 'Unblock' : 'Block'}
              >
                {blockStatus.hasBlocked ? '🚫' : '⛔'}
              </button>
              <button
                onClick={() => onStartCall?.('audio')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-gray-600 dark:text-gray-300 active:scale-95"
                title="Audio call"
              >
                📞
              </button>
              <button
                onClick={() => onStartCall?.('video')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-gray-600 dark:text-gray-300 active:scale-95"
                title="Video call"
              >
                📹
              </button>
            </>
          )}

          {conversation?.isGroup && (
            <button
              onClick={onOpenInfo}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-gray-600 dark:text-gray-300 active:scale-95"
              title="Group info"
            >
              ℹ️
            </button>
          )}
        </div>
      </div>

      {/* Search bar – compact and clean */}
      {showSearch && (
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={async (e) => {
                const q = e.target.value;
                setSearchQuery(q);
                if (!q.trim() || !conversationId) {
                  setSearchResults([]);
                  return;
                }
                try {
                  const results = await searchMessages({ conversationId, q });
                  setSearchResults(results);
                } catch (err) {
                  console.error('Search failed:', err);
                }
              }}
              className="w-full p-2 pl-9 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-md">
              {searchResults.map((msg) => (
                <div
                  key={msg._id}
                  className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => {
                    // Optional: scroll to message
                    setShowSearch(false);
                  }}
                >
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{msg.sender?.username}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Area – clean background, smooth scrolling */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
        style={{ scrollBehavior: 'smooth' }}
      >
        {loadingInitial ? (
          // Skeleton loader – refined
          <div className="space-y-4 p-4">
            <Skeleton count={5} height={60} className="mb-2 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Load older messages button – pill with micro‑interaction */}
            {hasMore && (
              <div className="flex justify-center sticky top-2 z-10">
                <button
                  onClick={() => fetchMessages(page + 1)}
                  disabled={loading}
                  className="text-xs sm:text-sm bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    'Load older messages'
                  )}
                </button>
              </div>
            )}

            {/* Messages with date separators – minimal */}
            {messagesWithDateHeaders.map((item, index) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${index}`} className="flex justify-center my-4">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1 rounded-full shadow-sm">
                      {formatDateHeader(item.date)}
                    </span>
                  </div>
                );
              }
              const msg = item.message;
              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={msg.sender?._id === user?._id}
                  onEdit={(id, content) => socket?.emit('edit-message', { messageId: id, content })}
                  onDelete={(id) => socket?.emit('delete-message', { messageId: id })}
                  onAddReaction={(id, emoji) => socket?.emit('add-reaction', { messageId: id, emoji })}
                  showAvatar={conversation?.isGroup && msg.sender?._id !== user?._id}
                />
              );
            })}

            {/* Typing indicator – sleek animation */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 px-2 py-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm italic">
                  {typingUsers.map((u) => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area – clean separator */}
      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <MessageInput
          conversationId={conversationId}
          onSend={(content, type, mediaUrl) =>
            socket?.emit('send-message', { conversationId, content, type, mediaUrl })
          }
          disabled={blockStatus.hasBlocked || blockStatus.isBlockedBy}
        />
      </div>
    </div>
  );
};

export default ChatWindow;