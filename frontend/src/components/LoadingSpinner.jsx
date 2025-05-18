import React from 'react';

// Simple CSS-based loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-blue-500 border-solid border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default LoadingSpinner;
