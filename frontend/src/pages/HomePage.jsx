import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Header />
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          Welcome to <span className="text-blue-600 dark:text-blue-400">SyncChat</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Connect with friends and colleagues in real-time. Secure, fast, and feature-rich messaging.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-center"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-center"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Why Choose SyncChat?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon="💬" 
            title="Real-time Chat" 
            description="Instant messaging with typing indicators and read receipts." 
          />
          <FeatureCard 
            icon="👥" 
            title="Group Conversations" 
            description="Create groups with multiple participants and manage them easily." 
          />
          <FeatureCard 
            icon="🔒" 
            title="Secure & Private" 
            description="End-to-end encryption and user blocking for your safety." 
          />
          <FeatureCard 
            icon="📁" 
            title="File Sharing" 
            description="Share images and files with Cloudinary integration." 
          />
        </div>
      </section>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <div className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800 text-center">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

export default HomePage;