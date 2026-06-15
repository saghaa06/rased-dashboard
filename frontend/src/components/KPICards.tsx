import React from 'react';
import Card from './ui/Card';
import { cn } from '../lib/utils';

interface KpiItem {
  label: string;
  value: string | number;
  accent?: 'blue' | 'green' | 'orange' | 'purple';
  description?: string;
}

interface KPICardsProps {
  items: KpiItem[];
}

const accentClasses: Record<string, string> = {
  blue: 'bg-sky-500/10 text-sky-700 dark:text-sky-200',
  green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  orange: 'bg-amber-500/10 text-amber-700 dark:text-amber-200',
  purple: 'bg-violet-500/10 text-violet-700 dark:text-violet-200',
};

const KPICards: React.FC<KPICardsProps> = ({ items }) => {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{item.value}</p>
              {item.description ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.description}</p> : null}
            </div>
            <div className={cn('rounded-3xl px-3 py-2 text-xs font-semibold', accentClasses[item.accent || 'blue'])}>
              {item.accent?.toUpperCase() || 'INFO'}
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
};

export default KPICards;
