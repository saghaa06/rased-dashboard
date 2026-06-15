import React from 'react';
import { cn } from '../../lib/utils';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

const Table: React.FC<TableProps> = ({ className, children, ...props }) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className={cn('min-w-full divide-y divide-slate-200 text-sm text-left dark:divide-slate-700', className)} {...props}>
        {children}
      </table>
    </div>
  );
};

export default Table;
