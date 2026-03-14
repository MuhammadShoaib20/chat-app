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
      <div className="p-4 space-y-4 bg-white dark:bg-gray-950 h-full">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton circle width={48} height={48} baseColor="#f3f4f6" highlightColor="#e5e7eb" />
            <div className="flex-1 space-y-2">
              <Skeleton height={14} width="60%" />
              <Skeleton height={10} width="40%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800">
      {/* Header with New Chat */}
      <div className="p-4 flex items-center justify-between bg-white dark:bg-gray-950 sticky top-0 z-10">
        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Chats</h1>
        <button
          onClick={() => setShowNewChat(true)}
          className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:scale-105 active:scale-95 transition-all"
          title="New Chat"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 p-8 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24 opacity-40">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-2.555-.337A5.945 5.945 0 015.41 20.97a.598.598 0 01-.784-.57l.028-1.488A5.913 5.913 0 012.13 16H2.13a5.94 5.94 0 01-.63-2.557C1.5 8.582 5.532 5 10.5 5S19.5 8.582 19.5 13z" />
                </svg>
            </div>
            <p className="text-sm font-semibold">No messages yet</p>
            <p className="text-xs mt-1">Tap the plus icon to start chatting</p>
          </div>
        ) : (
          <div className="px-2 space-y-0.5">
            {conversations.map(conv => {
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

              const isSelected = selectedId === conv._id;

              return (
                <div
                  key={conv._id}
                  onClick={() => onSelectConversation(conv._id, conv)}
                  className={`
                    group relative flex items-center p-3 cursor-pointer rounded-2xl transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                    }
                  `}
                >
                  {/* Avatar Section */}
                  <div className="relative mr-3 flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm ring-2 ring-white dark:ring-gray-800">
                        {avatar ? (
                        <img 
                            src={avatar} 
                            alt={displayName} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'U')}&background=random&bold=true`;
                            }}
                        />
                        ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-black uppercase">
                            {displayName?.charAt(0)}
                        </div>
                        )}
                    </div>
                    {!conv.isGroup && isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-950" />
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {displayName}
                        {conv.isGroup && <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-md font-medium uppercase tracking-tighter">Group</span>}
                      </h3>
                      {conv.lastMessage && (
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <p className={`text-xs truncate flex-1 ${isSelected ? 'text-blue-600/80 dark:text-blue-300/60' : 'text-gray-500 dark:text-gray-400'}`}>
                        {conv.lastMessage ? (
                          <>
                            {conv.lastMessage.sender?._id === user?._id && <span className="font-bold mr-1">You:</span>}
                            {conv.lastMessage.content}
                          </>
                        ) : (
                          <span className="italic opacity-60">No messages yet</span>
                        )}
                      </p>
                      
                      {/* Hidden delete on desktop, visible on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); 
                          deleteConversation(conv._id);
                        }}
                        className="ml-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all transform hover:scale-110"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 m-2 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold ring-2 ring-white dark:ring-gray-800">
            {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{user?.username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Logout"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
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