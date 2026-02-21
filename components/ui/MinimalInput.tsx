import React from 'react';

interface MinimalInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function MinimalInput({
  label,
  error,
  className = '',
  ...props
}: MinimalInputProps) {
  return (
    <div className="w-full group">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        className={`
          w-full py-2 bg-transparent border-b border-gray-200 
          text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-emerald-500 focus:ring-0
          transition-colors duration-200
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
