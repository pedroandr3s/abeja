import React from 'react';

const Loading = ({ 
  size = 'medium', 
  text = 'Cargando...', 
  fullScreen = false,
  color = 'bee-yellow' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-${color} ${sizeClasses[size]}`}></div>
      {text && (
        <p className={`text-gray-600 mt-2 ${size === 'small' ? 'text-sm' : 'text-base'}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-buzz">🐝</div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return <LoadingSpinner />;
};

export default Loading;