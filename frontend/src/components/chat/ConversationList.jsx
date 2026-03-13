import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversations } from '../../services/conversationService';
import { useSocketEvent } from '../../hooks/useSocketEvents';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import Skeleton from 'react-loading-skeleton';
import api from '../../services/api';
import toast from 'react-hot-toast';
import NewChatModal from './NewChatModal';

const ConversationList = ({ selectedId, onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id) => {
    if (!window.confirm('Delete this conversation permanently?')) return;
    try {
      await api.delete(`/api/conversations/${id}`);
      setConversations(prev => prev.filter(c => c._id !== id));
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error('Failed to delete conversation');
      console.error('Delete error:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useSocketEvent('new-message', (message) => {
    const convId = message.conversation?.toString?.() ?? message.conversation;
    setConversations(prev =>
      [...prev.map(conv =>
        String(conv._id) === String(convId)
          ? { ...conv, lastMessage: message, updatedAt: new Date().toISOString() }
          : conv
      )].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  });

  useSocketEvent('conversation-updated', (conv) => {
    if (!conv?._id) return;
    setConversations((prev) => {
      const exists = prev.some((c) => String(c._id) === String(conv._id));
      const next = exists
        ? prev.map((c) => (String(c._id) === String(conv._id) ? { ...c, ...conv } : c))
        : [conv, ...prev];
      return [...next].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  });

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <Skeleton circle width={40} height={40} className="flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton height={16} width="80%" />
              <Skeleton height={12} width="40%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* New Chat Button – Pill shaped */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowNewChat(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto py-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8 text-center">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-3 opacity-50">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <p className="text-sm font-light">No conversations yet</p>
            <p className="text-xs opacity-60 mt-1">Start a new chat to begin messaging</p>
          </div>
        ) : (
          conversations.map(conv => {
            let displayName = conv.name;
            let avatar = conv.avatar;
            let isOnline = false;
            let otherParticipant = null;

            if (!conv.isGroup) {
              otherParticipant = conv.participants?.find(p => p.userId?._id !== user?._id);
              if (otherParticipant) {
                displayName = otherParticipant.userId?.username || 'User';
                avatar = otherParticipant.userId?.avatar;
                isOnline = onlineUsers.includes(otherParticipant.userId?._id);
              }
            }

            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv._id, conv)}
                className={`
                  w-full flex items-center p-2 cursor-pointer transition-all duration-200 text-left
                  hover:bg-blue-50 dark:hover:bg-blue-900/20
                  ${selectedId === conv._id 
                    ? 'bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500 dark:border-blue-400' 
                    : 'border-l-4 border-transparent'
                  }
                `}
              >
                {/* Avatar */}
                <div className="relative mr-3 flex-shrink-0">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt={displayName} 
                      className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-gray-800"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=random`;
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-white font-bold shadow-sm">
                      {displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!conv.isGroup && isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
                  )}
                </div>

                {/* Conversation details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-medium text-sm truncate text-gray-900 dark:text-white">
                      {displayName}
                      {conv.isGroup && (
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                          (Group)
                        </span>
                      )}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                    {conv.lastMessage ? (
                      <>
                        {conv.lastMessage.sender?._id === user?._id && (
                          <span className="text-gray-500 dark:text-gray-500 mr-1">You:</span>
                        )}
                        <span className="truncate">{conv.lastMessage.content}</span>
                      </>
                    ) : (
                      <span className="italic text-gray-400 dark:text-gray-500">No messages yet</span>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <div className="flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); 
                      deleteConversation(conv._id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete conversation"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 text-white py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onChatCreated={() => {
            setShowNewChat(false);
            fetchConversations();
          }}
        />
      )}
    </div>
  );
};

export default ConversationList;