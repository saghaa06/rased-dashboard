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
    <div className="h-[320px] rounded-[12px] border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/95">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 14, right: 10, left: -6, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }} />
          <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={4} dot={{ r: 3.5, fill: '#0ea5e9' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const colors = ['#0ea5e9', '#22c55e', '#f97316', '#6366f1'];

export const PortailChart: React.FC<PortailChartProps> = ({ data }) => {
  return (
    <div className="h-[320px] rounded-[12px] border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/95">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 14, right: 10, left: -6, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="gate"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }} />
          <Bar dataKey="count" radius={[12, 12, 0, 0]} barSize={26}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
