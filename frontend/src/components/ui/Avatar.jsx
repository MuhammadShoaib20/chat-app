import { useState } from 'react';

const Avatar = ({ src, name, size = 10 }) => {
  const [error, setError] = useState(false);
  const initials = name?.charAt(0).toUpperCase() || '?';

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setError(true)}
        className={`w-${size} h-${size} rounded-full object-cover ring-2 ring-white dark:ring-gray-800`}
      />
    );
  }

  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-${Math.floor(size/3)}xl shadow-sm`}
    >
      {initials}
    </div>
  );
};

export default Avatar;