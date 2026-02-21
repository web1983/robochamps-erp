import React from 'react';

interface MinimalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export function MinimalButton({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: MinimalButtonProps) {
  const baseStyles =
    'py-3 px-6 font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';
  const variants = {
    primary:
      'bg-emerald-500 text-white hover:bg-emerald-600 border border-transparent',
    secondary:
      'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-transparent',
    outline:
      'bg-transparent text-gray-900 border border-gray-200 hover:border-emerald-500 hover:text-emerald-600',
  };
  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
