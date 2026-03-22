import { useState, useRef } from 'react';
import { searchUsers } from '../../services/userService';
import { createConversation } from '../../services/conversationService';
import { uploadFile } from '../../services/uploadService';
import { useAuth } from '../../hooks/useAuth';

const NewChatModal = ({ onClose, onChatCreated }) => {
  const [mode, setMode] = useState('chat'); // 'chat' | 'group'
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length < 2) { setUsers([]); return; }
    setLoading(true);
    try {
      const results = await searchUsers(term);
      setUsers(results.filter(u => u._id !== user._id));
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectUser = (targetUser) => {
    setSelectedUsers(prev => {
      const exists = prev.some(u => u._id === targetUser._id);
      return exists ? prev.filter(u => u._id !== targetUser._id) : [...prev, targetUser];
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      setGroupAvatar(url);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Failed to upload avatar.');
    } finally {
      setUploading(false);
    }
  };

  const startChat = async () => {
    if (mode === 'chat' && selectedUsers.length === 1) {
      try {
        const conv = await createConversation({
          participantIds: [selectedUsers[0]._id],
          isGroup: false,
        });
        onChatCreated(conv);
        onClose();
      } catch (error) {
        console.error('Failed to create conversation', error);
      }
    } else if (mode === 'group' && groupName.trim() && selectedUsers.length >= 1) {
      try {
        const conv = await createConversation({
          participantIds: selectedUsers.map(u => u._id),
          isGroup: true,
          name: groupName,
          avatar: groupAvatar || '',
        });
        onChatCreated(conv);
        onClose();
      } catch (error) {
        console.error('Failed to create group', error);
      }
    }
  };

  const confirmDisabled =
    (mode === 'chat' && selectedUsers.length !== 1) ||
    (mode === 'group' && (!groupName.trim() || selectedUsers.length === 0)) ||
    uploading;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-md max-h-[88vh] flex flex-col shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 pt-6 pb-3 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              {mode === 'chat' ? 'New Message' : 'Create Squad'}
            </h3>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">
              {mode === 'chat' ? 'Find someone to talk to' : 'Set up your group chat'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90 flex-shrink-0 mt-0.5"
            aria-label="Close modal"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 mb-4">
          <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl relative">
            <button
              onClick={() => setMode('chat')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 z-10 ${
                mode === 'chat' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => setMode('group')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 z-10 ${
                mode === 'group' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              Group
            </button>
            {/* Sliding pill */}
            <div
              className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-white dark:bg-gray-700 shadow-sm rounded-xl transition-transform duration-300 ease-out ${
                mode === 'group' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">

          {/* Group-only fields */}
          {mode === 'group' && (
            <div className="animate-in slide-in-from-top-3 duration-300 mb-5">
              {/* Avatar upload */}
              <div className="flex flex-col items-center mb-5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-[1.5rem] bg-blue-50 dark:bg-gray-800 border-2 border-dashed border-blue-200 dark:border-gray-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-all active:scale-95 shadow-inner"
                  aria-label="Upload group avatar"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Group avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-blue-400 dark:text-gray-500">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-blue-600/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
                <p className="text-[10px] font-black uppercase tracking-tighter text-gray-400 dark:text-gray-500 mt-2.5">
                  Group Picture
                </p>
              </div>

              {/* Group name input */}
              <input
                type="text"
                placeholder="What's the squad name?"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-gray-950 rounded-2xl outline-none transition-all text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          )}

          {/* Search box */}
          <div className="relative mb-3 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-11 pr-11 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-gray-950 rounded-2xl outline-none transition-all text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* User list */}
          <div className="space-y-1.5 mb-6">
            {users.length === 0 && searchTerm.length >= 2 && !loading && (
              <div className="text-center py-10">
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500">No users found</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Try a different username</p>
              </div>
            )}
            {users.map((u) => {
              const isSelected = selectedUsers.some((s) => s._id === u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => toggleSelectUser(u)}
                  className={`group flex items-center p-3 rounded-[1.25rem] cursor-pointer transition-all active:scale-[0.98] border-2 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500/40'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="relative mr-3 flex-shrink-0">
                    <img
                      src={u.avatar || '/default-avatar.png'}
                      alt={u.username}
                      className={`w-11 h-11 rounded-2xl object-cover ring-4 transition-all ${
                        isSelected
                          ? 'ring-blue-100 dark:ring-blue-900/40'
                          : 'ring-gray-100 dark:ring-gray-800 group-hover:ring-blue-50 dark:group-hover:ring-blue-900/20'
                      }`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || 'U')}&background=random&bold=true`;
                      }}
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center animate-in zoom-in duration-200">
                        <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3.5" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-gray-900 dark:text-white truncate tracking-tight">
                      {u.username}
                    </p>
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 truncate uppercase tracking-widest">
                      {u.email?.split('@')[0]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Close
          </button>
          <button
            onClick={startChat}
            disabled={confirmDisabled}
            className={`flex-[1.5] px-6 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20 transition-all duration-300 ${
              confirmDisabled
                ? 'opacity-0 translate-y-2 pointer-events-none'
                : 'opacity-100 translate-y-0 hover:scale-[1.02] active:scale-95'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;