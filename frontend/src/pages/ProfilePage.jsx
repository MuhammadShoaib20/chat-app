import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large (max 2MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/api/users/profile', { username, avatar });
      const updatedUser = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-xl w-full bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-gray-100 dark:border-gray-800 p-8 sm:p-12 animate-in fade-in zoom-in-95 duration-500">
        
        <header className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Account Settings</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-light text-sm">Manage your public profile and identity</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Enhanced Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-blue-50 dark:ring-blue-900/20 shadow-xl transition-all group-hover:ring-blue-500/50">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  </div>
                )}
              </div>
              
              {/* Overlay Edit Icon */}
              <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 bg-blue-600 p-2.5 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-700 hover:scale-110 transition-all border-4 border-white dark:border-gray-900">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/></svg>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <p className="mt-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Profile Photo</p>
          </div>

          <div className="grid gap-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                placeholder="How should we call you?"
              />
            </div>

            {/* Email Field (Disabled) */}
            <div className="space-y-2 opacity-80">
              <label className="text-sm font-bold text-gray-500 dark:text-gray-500 ml-1">Email Address (Permanent)</label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-5 py-3.5 bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 dark:text-gray-500 cursor-not-allowed font-medium"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
            ) : (
              <>
                <span>Save Changes</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;