import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2 my-6">
      <div className="w-5 h-5 rounded-full bg-sky-400 animate-pulse"></div>
      <div className="w-5 h-5 rounded-full bg-sky-400 animate-pulse_delayed_200"></div>
      <div className="w-5 h-5 rounded-full bg-sky-400 animate-pulse_delayed_400"></div>
      <span className="text-slate-300 ml-2">Analyzuji, prosím čekejte...</span>
    </div>
  );
};

export default LoadingSpinner;
