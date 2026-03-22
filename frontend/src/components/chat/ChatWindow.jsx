import { useState, useEffect, useRef, useCallback } from 'react';
import { getMessages, markAsRead, searchMessages } from '../../services/messageService';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import Skeleton from 'react-loading-skeleton';
import { blockUser, getBlockStatus, unblockUser } from '../../services/userService';

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
  onOpenSidebar,
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
      const newMessages = data.messages || [];
      if (isInitial) {
        setMessages(newMessages);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
        const container = messagesContainerRef.current;
        if (container) {
          const oldScrollHeight = container.scrollHeight;
          setTimeout(() => {
            container.scrollTop = container.scrollHeight - oldScrollHeight;
          }, 0);
        }
      }
      setHasMore(data.totalPages ? pageNum < data.totalPages : false);
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

  useEffect(() => {
    if (!messages.length) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom) {
      setTimeout(() => scrollToBottom(true), 50);
    }
  }, [messages]);

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

  useEffect(() => {
    if (!conversationId || !user?._id || !messages.length) return;
    const unread = messages.filter(
      (m) => m?.sender?._id !== user._id && !(m.readBy || []).includes(user._id)
    );
    if (!unread.length) return;
    const messageIds = unread.map((m) => m._id);
    markAsRead({ conversationId, messageIds }).catch((e) => {
      console.error('Failed to mark as read:', e);
    });
  }, [conversationId, user?._id, messages]);

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
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-5 shadow-sm">
          <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-2.555-.337A5.945 5.945 0 015.41 20.97a.598.598 0 01-.784-.57l.028-1.488A5.913 5.913 0 012.13 16H2.13a5.94 5.94 0 01-.63-2.557C1.5 8.582 5.532 5 10.5 5S19.5 8.582 19.5 13z" />
          </svg>
        </div>
        <p className="text-gray-900 dark:text-white font-bold text-base tracking-tight">No conversation selected</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Choose a chat from the sidebar to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 relative">

      {/* ── Header ── */}
      <div className="flex-shrink-0 z-20 flex items-center justify-between px-4 py-3 md:px-5 md:py-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 gap-2">
        <div className="flex items-center min-w-0 flex-1 gap-3">

          {/* Back button (mobile) */}
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-90"
              aria-label="Open sidebar"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm ring-2 ring-white dark:ring-gray-800">
              {conversation?.avatar ? (
                <img
                  src={conversation.avatar}
                  alt={conversation?.name || otherParticipant?.userId?.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation?.name || 'G')}&background=random&bold=true`;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-base uppercase">
                  {(conversation?.name || otherParticipant?.userId?.username || 'U').charAt(0)}
                </div>
              )}
            </div>
            {!conversation?.isGroup && isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-950" />
            )}
          </div>

          {/* Name + status */}
          <div className="truncate">
            <h2 className="text-base md:text-[17px] font-bold text-gray-900 dark:text-white truncate leading-tight">
              {conversation?.name || otherParticipant?.userId?.username}
              {conversation?.isGroup && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-md font-medium uppercase tracking-tighter align-middle">
                  Group
                </span>
              )}
            </h2>
            {!conversation?.isGroup && (
              <p className="text-xs font-medium mt-0.5 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <span className={isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </p>
            )}
            {conversation?.isGroup && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {conversation?.participants?.length || 0} members
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) { setSearchQuery(''); setSearchResults([]); }
            }}
            className={`p-2 rounded-xl transition-all active:scale-90 ${
              showSearch
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label="Search messages"
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
              className={`p-2 rounded-xl transition-all active:scale-90 ${
                blockStatus.hasBlocked
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={blockStatus.hasBlocked ? 'Unblock user' : 'Block user'}
              aria-label={blockStatus.hasBlocked ? 'Unblock user' : 'Block user'}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          )}

          {conversation?.isGroup && (
            <button
              onClick={onOpenInfo}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-90"
              aria-label="Group info"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Search Overlay ── */}
      {showSearch && (
        <div className="absolute top-[calc(100%+0px)] left-0 right-0 p-3 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-30 animate-in slide-in-from-top duration-200 shadow-lg">
          <div className="relative max-w-2xl mx-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Search in messages..."
              value={searchQuery}
              onChange={async (e) => {
                const q = e.target.value;
                setSearchQuery(q);
                if (!q.trim() || !conversationId) { setSearchResults([]); return; }
                try {
                  const results = await searchMessages({ conversationId, q });
                  setSearchResults(results);
                } catch (err) {
                  console.error('Search failed:', err);
                }
              }}
              className="w-full py-2.5 pl-10 pr-4 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/30 transition-all outline-none"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 max-w-2xl mx-auto max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl custom-scrollbar">
              {searchResults.map((msg) => (
                <div
                  key={msg._id}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border-b last:border-0 border-gray-50 dark:border-gray-800"
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

      {/* ── Messages Area ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-scroll overscroll-contain px-4 py-4 md:px-5 bg-gray-50 dark:bg-gray-950 custom-scrollbar"
        style={{ scrollbarGutter: 'stable' }}
      >
        {loadingInitial ? (
          <div className="space-y-6 p-2">
            <Skeleton count={4} height={70} borderRadius={16} />
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center sticky top-0 z-10 py-2">
                <button
                  onClick={() => fetchMessages(page + 1)}
                  disabled={loading}
                  className="text-xs font-bold uppercase tracking-wider bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load History'}
                </button>
              </div>
            )}

            <div className="flex flex-col gap-1 pb-2">
            {messagesWithDateHeaders.map((item, index) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${index}`} className="flex justify-center my-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-1 rounded-lg shadow-sm">
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

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2.5 px-2 py-1 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none px-3 py-2.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 italic">
                  {typingUsers.length === 1
                    ? `${typingUsers[0].username} is typing...`
                    : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
            </div>
          </>
        )}
      </div>

      {/* ── Block Status Banner ── */}
      {(blockStatus.hasBlocked || blockStatus.isBlockedBy) && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/20">
          <p className="text-xs text-center text-red-500 dark:text-red-400 font-bold uppercase tracking-wider">
            {blockStatus.hasBlocked ? 'You have blocked this user' : 'You are blocked by this user'}
          </p>
        </div>
      )}

      {/* ── Input Area ── */}
      <MessageInput
        conversationId={conversationId}
        onSend={(content, type, mediaUrl) =>
          socket?.emit('send-message', { conversationId, content, type, mediaUrl })
        }
        disabled={blockStatus.hasBlocked || blockStatus.isBlockedBy}
      />
    </div>
  );
};

export default ChatWindow;