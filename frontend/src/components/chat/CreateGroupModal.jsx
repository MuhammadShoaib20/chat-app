import { useState, useEffect } from 'react';
import { searchUsers } from '../../services/userService';
import { createConversation } from '../../services/conversationService';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.trim()) {
      setSearching(true);
      const delay = setTimeout(async () => {
        try {
          const results = await searchUsers(searchTerm);
          setUsers(results);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setSearching(false);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setUsers([]);
      setSearching(false);
    }
  }, [searchTerm]);

  const handleSelectUser = (user) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length < 1) return;
    setLoading(true);
    try {
      const participantIds = selectedUsers.map(u => u._id);
      const newGroup = await createConversation({
        participantIds,
        isGroup: true,
        name: groupName,
      });
      onGroupCreated(newGroup);
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Group</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Group name input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group name
            </label>
            <input
              type="text"
              placeholder="e.g., Project Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow min-h-[48px]"
            />
          </div>

          {/* Search users */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Add members
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow min-h-[48px]"
              />
              <svg
                className="absolute left-3 top-3.5 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searching && (
                <div className="absolute right-3 top-3.5">
                  <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Search results */}
          {users.length > 0 && (
            <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <button
                  type="button"
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left min-h-[52px]"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{user.username}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                    {user.email}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Selected users chips */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selected ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <span
                    key={user._id}
                    className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full pl-3 pr-1 py-1.5 text-sm border border-blue-200 dark:border-blue-800"
                  >
                    {user.username}
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user._id)}
                      className="ml-1 w-6 h-6 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300 transition-colors"
                      aria-label="Remove"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || !groupName.trim() || selectedUsers.length < 1}
            className="flex-1 min-h-[48px] px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              'Create Group'
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;