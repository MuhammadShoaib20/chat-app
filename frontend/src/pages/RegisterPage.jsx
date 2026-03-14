import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { uploadFile } from '../services/uploadService';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: null,
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large (max 2MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setFormData((prev) => ({ ...prev, avatar: file }));
    setPreviewError(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.onerror = () => {
      setPreviewError(true);
      toast.error('Failed to load image preview');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = '';
      if (formData.avatar) {
        const { url } = await uploadFile(formData.avatar);
        avatarUrl = url;
      }
      await register(formData.username, formData.email, formData.password, avatarUrl);
      toast.success('Registration successful');
      navigate('/chat');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-lg w-full z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-all group"
        >
          <svg className="group-hover:-translate-x-1 transition-transform" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-gray-100 dark:border-gray-800 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Join SyncChat</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Connect with the world in seconds</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Minimal Avatar Upload */}
            <div className="flex flex-col items-center pb-4 border-b border-gray-50 dark:border-gray-800/50">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-gray-100 dark:bg-gray-800 overflow-hidden ring-4 ring-white dark:ring-gray-900 shadow-xl group-hover:scale-105 transition-all duration-300">
                  {avatarPreview && !previewError ? (
                    <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl text-white shadow-lg cursor-pointer hover:bg-blue-700 hover:rotate-12 transition-all">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              <span className="text-[10px] uppercase tracking-tighter text-gray-400 mt-4 font-bold">Pick an identity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Username */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase ml-1">Username</label>
                <input
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="johndoe"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase ml-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase ml-1">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase ml-1">Confirm</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Already part of the community?{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-bold transition-all">
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;