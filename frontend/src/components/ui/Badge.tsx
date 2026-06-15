import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'info' | 'neutral';
}

const badgeStyles: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
  danger: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-200',
};

const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className, ...props }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
        badgeStyles[variant],
        className
      )}
      {...props}
    />
  );
};

export default Badge;
