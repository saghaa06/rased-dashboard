import React from 'react';
import DownloadButton from './ui/DownloadButton';
import { downloadCsv } from '../utils/excel';
import type { HistoryRecord } from './HistoryTable';

type Props = {
  records: HistoryRecord[];
};

const HistoryExportButton: React.FC<Props> = ({ records }) => {
  const handleExport = () => {
    const rows = records.map((r) => ({
      id: r.id,
      plate: r.plate_text ?? r.numero_enregistrement ?? '',
      numero_enregistrement: r.numero_enregistrement ?? '',
      wilaya: r.wilaya ?? '',
      type: r.vehicle_type ?? '',
      gate: r.gate ?? '',
      direction: r.direction ?? '',
      created_at: r.created_at ?? '',
      entry_method: r.entry_method ?? '',
    }));

    downloadCsv(`historique_passages_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <DownloadButton
      onClick={handleExport}
      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
    >
      Export Excel
    </DownloadButton>
  );
};

export default HistoryExportButton;

