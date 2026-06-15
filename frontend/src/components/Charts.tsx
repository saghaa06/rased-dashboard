import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface TrafficPoint {
  date: string;
  count: number;
}

interface GatePoint {
  gate: string;
  count: number;
}

interface TrafficChartProps {
  data: TrafficPoint[];
}

interface PortailChartProps {
  data: GatePoint[];
 }

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderRadius: '1rem',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  color: '#f8fafc',
  padding: '0.85rem 1rem',
};

export const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  return (
    <div className="h-[320px] rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Trafic</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">7 derniers jours</h2>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 14, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }} />
          <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3, fill: '#0ea5e9' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const colors = ['#0ea5e9', '#22c55e', '#f97316', '#6366f1'];

export const PortailChart: React.FC<PortailChartProps> = ({ data }) => {
  return (
    <div className="h-[320px] rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mb-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Portails</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">Passages par portail</h2>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 14, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="gate" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }} />
          <Bar dataKey="count" radius={[12, 12, 0, 0]}> 
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
