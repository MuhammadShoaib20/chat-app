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
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-8 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-2.555-.337A5.945 5.945 0 015.41 20.97a.598.598 0 01-.784-.57l.028-1.488A5.913 5.913 0 012.13 16H2.13a5.94 5.94 0 01-.63-2.557C1.5 8.582 5.532 5 10.5 5S19.5 8.582 19.5 13z" /></svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 gap-2 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center min-w-0 flex-1 gap-3">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="truncate">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate leading-tight">
              {conversation?.name || otherParticipant?.userId?.username}
            </h2>
            {!conversation?.isGroup && (
              <p className="text-[11px] sm:text-xs font-medium mt-0.5 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                <span className={isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                    {isOnline ? 'Online' : 'Offline'}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${showSearch ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>

          {!conversation?.isGroup && otherParticipant && (
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
              className={`p-2.5 rounded-xl transition-all active:scale-90 ${blockStatus.hasBlocked ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title={blockStatus.hasBlocked ? 'Unblock' : 'Block'}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          )}

          {conversation?.isGroup && (
            <button
              onClick={onOpenInfo}
              className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-90"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Search bar Overlay */}
      {showSearch && (
        <div className="absolute top-[65px] left-0 right-0 p-3 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-30 animate-in slide-in-from-top duration-200">
          <div className="relative max-w-2xl mx-auto">
            <input
              autoFocus
              type="text"
              placeholder="Search in messages..."
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
              className="w-full py-2.5 pl-10 pr-4 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 max-w-2xl mx-auto max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl">
              {searchResults.map((msg) => (
                <div
                  key={msg._id}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border-b last:border-0 dark:border-gray-800"
                  onClick={() => setShowSearch(false)}
                >
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{msg.sender?.username}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-950 scroll-smooth"
      >
        {loadingInitial ? (
          <div className="space-y-6"><Skeleton count={4} height={70} borderRadius={16} /></div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center sticky top-0 z-10 py-2">
                <button
                  onClick={() => fetchMessages(page + 1)}
                  disabled={loading}
                  className="text-[11px] font-bold uppercase tracking-wider bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load History'}
                </button>
              </div>
            )}

            {messagesWithDateHeaders.map((item, index) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${index}`} className="flex justify-center my-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-500 bg-gray-200/50 dark:bg-gray-800/50 px-3 py-1 rounded-lg">
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

            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs font-medium text-gray-400 italic">
                  {typingUsers[0].username} is typing...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <MessageInput
          conversationId={conversationId}
          onSend={(content, type, mediaUrl) =>
            socket?.emit('send-message', { conversationId, content, type, mediaUrl })
          }
          disabled={blockStatus.hasBlocked || blockStatus.isBlockedBy}
        />
        {(blockStatus.hasBlocked || blockStatus.isBlockedBy) && (
            <p className="text-[11px] text-center text-red-500 font-bold uppercase tracking-tighter mt-2">
                {blockStatus.hasBlocked ? 'You have blocked this user' : 'You are blocked by this user'}
            </p>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;