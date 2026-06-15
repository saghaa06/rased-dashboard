import React from 'react';
import Badge from './ui/Badge';
import Table from './ui/Table';
import { parseAlgerianPlate } from '../utils/plateParser';

export interface HistoryRecord {
  id: string | number;
  plate_text?: string;
  numero_enregistrement?: string;
  gate?: string;
  direction?: string;
  created_at?: string;
  entry_method?: string;
  vehicle_type?: string;
  wilaya?: string;
}

interface HistoryTableProps {
  records: HistoryRecord[];
}

const HistoryTable: React.FC<HistoryTableProps> = ({ records }) => {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 shadow-soft dark:border-slate-800 dark:bg-slate-900/95">
      <div className="sticky top-0 bg-white/95 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm dark:bg-slate-900/95 dark:text-slate-400">
        Historique des passages
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <thead className="bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Plaque</th>
              <th className="px-6 py-4">Enregistrement</th>
              <th className="px-6 py-4">Wilaya</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Portail</th>
              <th className="px-6 py-4">Direction</th>
              <th className="px-6 py-4">Heure</th>
              <th className="px-6 py-4">Méthode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {records.map((item) => {
              const plateInfo = parseAlgerianPlate(item.plate_text || item.numero_enregistrement || '');
              const direction = item.direction || 'in';
              const method = item.entry_method || 'manual';
              return (
                <tr key={item.id} className="transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{item.plate_text || item.numero_enregistrement || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">{item.numero_enregistrement || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">{item.wilaya || plateInfo.wilaya || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">{plateInfo.typeLabel || item.vehicle_type || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">{item.gate || '—'}</td>
                  <td className="px-6 py-4"><Badge variant={direction === 'in' ? 'success' : 'danger'}>{direction}</Badge></td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">{item.created_at ? new Date(item.created_at).toLocaleString('fr-FR') : '—'}</td>
                  <td className="px-6 py-4"><Badge variant={method === 'auto' ? 'info' : 'neutral'}>{method}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </section>
  );
};

export default HistoryTable;
