import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'outline';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'surface', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-slate-200/70 bg-white/95 shadow-soft transition-shadow duration-200 ease-out hover:shadow-soft/0 dark:border-slate-800/70 dark:bg-slate-900/95',
          variant === 'outline' && 'bg-transparent shadow-none border-slate-200/60 dark:border-slate-700/60',
          className
        )}

        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export default Card;
