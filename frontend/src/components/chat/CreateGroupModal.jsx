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

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setUsers([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(searchTerm);
        setUsers(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // User selection handlers
  const handleSelectUser = (user) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
      // Optional: clear search to avoid clutter
      setSearchTerm('');
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  // Create group
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

  const canCreate = !loading && groupName.trim() && selectedUsers.length >= 1;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-950 rounded-t-[2rem] sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 dark:border-gray-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 flex flex-col">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white/70 dark:bg-gray-950/70 backdrop-blur-md px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                Create Group
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a new group conversation</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"
              aria-label="Close modal"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Group name */}
          <div>
            <label htmlFor="group-name" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">
              Group Identity
            </label>
            <input
              id="group-name"
              type="text"
              autoFocus
              placeholder="Give your group a name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm"
            />
          </div>

          {/* Member search */}
          <div>
            <label htmlFor="member-search" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">
              Add Members
            </label>
            <div className="relative group">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
              <input
                id="member-search"
                type="text"
                placeholder="Find people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none text-sm"
              />
            </div>
          </div>

          {/* Search results */}
          {users.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((user) => (
                <button
                  type="button"
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.username}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-500 flex items-center justify-center transition-colors flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected member chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <span
                  key={user._id}
                  className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl pl-3 pr-1.5 py-1.5 text-xs font-bold border border-blue-100 dark:border-blue-800/40 animate-in zoom-in-95 duration-200"
                >
                  {user.username}
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user._id)}
                    className="w-4 h-4 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                    aria-label={`Remove ${user.username}`}
                  >
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60 backdrop-blur-md flex flex-row-reverse gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className="flex-1 py-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              'Launch Group'
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3.5 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;