import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { searchUsers } from '../../services/userService';

const GroupInfoPanel = ({ conversation, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState(conversation.participants || []);
  const [groupName, setGroupName] = useState(conversation.name || '');
  const [groupAvatar, setGroupAvatar] = useState(conversation.avatar || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const isAdmin = members.some(p => p.userId?._id === user?._id && p.role === 'admin');

  // Search Logic
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const delay = setTimeout(async () => {
      try {
        const results = await searchUsers(searchTerm);
        const existingIds = members.map(m => m.userId?._id);
        const filtered = results.filter(u => !existingIds.includes(u._id));
        setSearchResults(filtered);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm, members]);

  const handleUpdateGroup = async () => {
    try {
      setLoading(true);
      const { data } = await api.put(`/api/conversations/${conversation._id}`, {
        name: groupName,
        avatar: groupAvatar,
      });
      onUpdate(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      setLoading(true);
      const { data } = await api.post(`/api/conversations/${conversation._id}/participants`, {
        userIds: [userId],
      });
      setMembers(data.participants);
      setShowAddMember(false);
      setSearchTerm('');
      onUpdate(data);
    } catch (error) {
      console.error('Add member failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      setLoading(true);
      await api.delete(`/api/conversations/${conversation._id}/participants/${userId}`);
      const updated = members.filter(p => p.userId?._id !== userId);
      setMembers(updated);
      onUpdate({ ...conversation, participants: updated });
    } catch (error) {
      console.error('Remove member failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await api.delete(`/api/conversations/${conversation._id}/participants/${user._id}`);
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Leave group failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto z-50 border-l border-gray-200 dark:border-gray-700 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Group Details</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-5">
        {/* Group Identity Section - Fixed Avatar Fallback */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {groupAvatar ? (
              <img
                src={groupAvatar}
                alt={groupName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-white dark:border-gray-800">
                {groupName?.charAt(0).toUpperCase() || 'G'}
              </div>
            )}
            {isAdmin && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors"
                title="Edit group"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="w-full mt-4 space-y-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Group name"
              />
              <input
                type="text"
                value={groupAvatar}
                onChange={(e) => setGroupAvatar(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Avatar URL"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateGroup}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center mt-3">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">{groupName}</h4>
              {isAdmin && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Admin · You can manage group</p>
              )}
            </div>
          )}
        </div>

        <hr className="my-6 border-gray-200 dark:border-gray-700" />

        {/* Members Section */}
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Members ({members.length})</h4>
          {isAdmin && (
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full shadow-sm transition-colors flex items-center gap-1"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" />
              </svg>
              {showAddMember ? 'Cancel' : 'Add'}
            </button>
          )}
        </div>

        {/* Add Member Search */}
        {showAddMember && (
          <div className="mb-5 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searching && (
                <div className="absolute right-3 top-2.5">
                  <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {searchResults.map((u) => (
                  <div key={u._id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{u.username}</span>
                    <button
                      onClick={() => handleAddMember(u._id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-full transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
            {searchTerm && !searching && searchResults.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No users found</p>
            )}
          </div>
        )}

        {/* Member List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {members.map((m) => (
            <div key={m.userId?._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <img
                src={m.userId?.avatar || '/default-avatar.png'}
                alt=""
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.userId?.username || 'User')}&background=random`;
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {m.userId?.username}
                </p>
                <div className="flex items-center gap-2">
                  {m.role === 'admin' && (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              {isAdmin && m.userId?._id !== user?._id && (
                <button
                  onClick={() => handleRemoveMember(m.userId?._id)}
                  className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove member"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave Group Button */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-5 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLeaveGroup}
          className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Leave Group
        </button>
      </div>
    </div>
  );
};

export default GroupInfoPanel;