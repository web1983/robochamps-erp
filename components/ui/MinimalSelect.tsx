import React from 'react';

interface MinimalSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function MinimalSelect({
  label,
  error,
  className = '',
  children,
  ...props
}: MinimalSelectProps) {
  return (
    <div className="w-full group">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <select
        className={`
          w-full py-2 bg-transparent border-b border-gray-200 
          text-gray-900
          focus:outline-none focus:border-emerald-500 focus:ring-0
          transition-colors duration-200
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        style={{ color: '#111827' }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
