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
      console.error(error);
      toast.error('Failed to delete');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  // Socket: New Message logic
  useSocketEvent('new-message', (message) => {
    const convId = message.conversation?.toString?.() ?? message.conversation;
    setConversations(prev => {
      const updated = prev.map(conv =>
        String(conv._id) === String(convId)
          ? { ...conv, lastMessage: message, updatedAt: new Date().toISOString() }
          : conv
      );
      return [...updated].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  });

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 bg-white dark:bg-gray-950 h-full">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton circle width={48} height={48} baseColor={user?.darkMode ? '#1f2937' : '#f3f4f6'} />
            <div className="flex-1"><Skeleton height={15} width="60%" /><Skeleton height={10} width="40%" /></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 transition-colors duration-300">
      
      {/* ── Glassmorphic Header ── */}
      <div className="sticky top-0 z-20 px-5 py-5 flex items-center justify-between bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-50 dark:border-gray-900">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Messages</h1>
        <button
          onClick={() => setShowNewChat(true)}
          className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:scale-110 active:scale-95"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Conversation List ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pt-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[32px] flex items-center justify-center mb-4">
              <svg className="text-gray-300 w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-2.555-.337A5.945 5.945 0 015.41 20.97a.598.598 0 01-.784-.57l.028-1.488A5.913 5.913 0 012.13 16H2.13a5.94 5.94 0 01-.63-2.557C1.5 8.582 5.532 5 10.5 5S19.5 8.582 19.5 13z" /></svg>
            </div>
            <p className="text-gray-500 font-bold">No chats yet</p>
            <button onClick={() => setShowNewChat(true)} className="text-blue-500 text-sm mt-2 font-medium hover:underline">Start a new one</button>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map(conv => {
              const otherParticipant = !conv.isGroup ? conv.participants?.find(p => p.userId?._id !== user?._id) : null;
              const displayName = conv.isGroup ? conv.name : (otherParticipant?.userId?.username || 'User');
              const avatar = conv.isGroup ? conv.avatar : otherParticipant?.userId?.avatar;
              const isOnline = !conv.isGroup && onlineUsers.includes(otherParticipant?.userId?._id);
              const isSelected = selectedId === conv._id;

              return (
                <div
                  key={conv._id}
                  onClick={() => onSelectConversation(conv._id, conv)}
                  className={`group relative flex items-center p-3 cursor-pointer rounded-[24px] transition-all duration-300 active:scale-[0.97] ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-100 dark:ring-blue-800/30' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  {/* Avatar with Gradient Fallback */}
                  <div className="relative mr-4 flex-shrink-0">
                    <div className="w-12 h-12 rounded-[18px] overflow-hidden shadow-sm">
                      {avatar ? (
                        <img src={avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-[3px] border-white dark:border-gray-950" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={`text-[15px] font-bold truncate ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                        {displayName}
                      </h3>
                      {conv.lastMessage && (
                        <span className="text-[10px] font-semibold text-gray-400 uppercase">{formatTime(conv.lastMessage.createdAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <p className={`text-xs truncate flex-1 ${isSelected ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                        {conv.lastMessage ? (
                          <span>{conv.lastMessage.sender?._id === user?._id && 'You: '}{conv.lastMessage.content}</span>
                        ) : <span className="italic opacity-50">No messages yet</span>}
                      </p>
                      
                      {/* Hover Actions */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv._id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all hover:scale-125"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer / User Profile ── */}
      <div className="p-4 mt-auto border-t border-gray-50 dark:border-gray-900">
        <div className="flex items-center gap-3 p-2 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-sm font-black shadow-inner">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{user?.username}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-gray-500 font-medium">Online Now</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            title="Logout"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onChatCreated={() => { setShowNewChat(false); fetchConversations(); }}
        />
      )}
    </div>
  );
};

export default ConversationList;