import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
}

const variants: Record<string, string> = {
  primary:
    'bg-sky-600 text-white shadow-sm hover:bg-sky-700 active:bg-sky-800/90 focus-visible:ring-sky-500',
  secondary:
    'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300/90 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:bg-slate-800/90',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-800/70 dark:active:bg-slate-800/90',
  outline:
    'border border-slate-300/80 text-slate-700 hover:bg-slate-100 active:bg-slate-200/70 dark:border-slate-700/80 dark:text-slate-100 dark:hover:bg-slate-800/70 dark:active:bg-slate-800/90',
  disabled: 'opacity-60 cursor-not-allowed',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed',
          disabled ? variants.disabled : variants[variant],
          className
        )}
        disabled={disabled}
        {...props}
      />
    );
  }
);


Button.displayName = 'Button';

export default Button;
