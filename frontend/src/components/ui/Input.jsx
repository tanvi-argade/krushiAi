import React from 'react';

const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-nature-soil/70 dark:text-dark-text/70 ml-1">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none
          bg-white dark:bg-dark-card
          border-nature-fog dark:border-white/10
          focus:border-nature-leaf focus:ring-4 focus:ring-nature-leaf/10
          dark:focus:border-nature-sky dark:focus:ring-nature-sky/10
          placeholder:text-gray-400 dark:placeholder:text-gray-600
          ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-500 ml-1 mt-0.5">{error}</span>}
    </div>
  );
};

export default Input;
