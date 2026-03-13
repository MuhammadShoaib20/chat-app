import { useState, useRef } from 'react';
import { searchUsers } from '../../services/userService';
import { createConversation } from '../../services/conversationService';
import { uploadFile } from '../../services/uploadService';
import { useAuth } from '../../hooks/useAuth';

const NewChatModal = ({ onClose, onChatCreated }) => {
  const [mode, setMode] = useState('chat'); // 'chat' or 'group'
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
    if (term.length < 2) return;
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
      if (exists) {
        return prev.filter(u => u._id !== targetUser._id);
      } else {
        return [...prev, targetUser];
      }
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      setGroupAvatar(url);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const startChat = async () => {
    if (mode === 'chat' && selectedUsers.length === 1) {
      const targetUser = selectedUsers[0];
      try {
        const conv = await createConversation({
          participantIds: [targetUser._id],
          isGroup: false,
        });
        onChatCreated(conv);
        onClose();
      } catch (error) {
        console.error('Failed to create conversation', error);
      }
    } else if (mode === 'group' && groupName.trim() && selectedUsers.length >= 1) {
      try {
        const participantIds = selectedUsers.map(u => u._id);
        const conv = await createConversation({
          participantIds,
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <h3 className="text-xl font-semibold mb-5 text-gray-900 dark:text-white">
          {mode === 'chat' ? 'New Chat' : 'Create Group'}
        </h3>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setMode('chat')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              mode === 'chat'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setMode('group')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              mode === 'group'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Group
          </button>
        </div>

        {/* Group Avatar Upload (only in group mode) */}
        {mode === 'group' && (
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
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:opacity-90 transition-opacity shadow-md"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="group avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500 dark:text-gray-400">
                    <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Click to upload group picture
            </p>
          </div>
        )}

        {/* Group Name Input (only in group mode) */}
        {mode === 'group' && (
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2.5 mb-5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        )}

        {/* Search Input */}
        <div className="relative mb-5">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          <svg
            className="absolute left-3 top-3 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {loading && (
            <div className="absolute right-3 top-3">
              <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>

        {/* User List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain -mx-2 px-2">
          {users.length === 0 && searchTerm.length >= 2 && !loading && (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">No users found</p>
          )}
          {users.map((u) => {
            const isSelected = selectedUsers.some((s) => s._id === u._id);
            return (
              <div
                key={u._id}
                onClick={() => toggleSelectUser(u)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                }`}
              >
                <div className="relative mr-3 flex-shrink-0">
                  <img
                    src={u.avatar || '/default-avatar.png'}
                    alt={u.username}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{u.username}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                </div>
                {mode === 'group' && (
                  <div className="ml-2 flex-shrink-0">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-400 dark:border-gray-500'
                    }`}>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={startChat}
            disabled={
              (mode === 'chat' && selectedUsers.length !== 1) ||
              (mode === 'group' && (!groupName.trim() || selectedUsers.length === 0)) ||
              uploading
            }
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
          >
            {mode === 'chat' ? 'Start Chat' : 'Create Group'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;