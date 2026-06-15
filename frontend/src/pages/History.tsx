import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import HistoryTable, { HistoryRecord } from '../components/HistoryTable';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import HistoryExportButton from '../components/HistoryExportButton';


const HistoryPage: React.FC = () => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [search, setSearch] = useState('');
  const [gateFilter, setGateFilter] = useState('all');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.get('/history/');
        setRecords(response.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    loadHistory();
  }, []);

  const filteredRecords = useMemo(
    () => records.filter((item) => {
      const query = search.toLowerCase();
      const gateMatch = gateFilter === 'all' || item.gate === gateFilter;
      const plateMatch = item.plate_text?.toLowerCase().includes(query) || item.numero_enregistrement?.toLowerCase().includes(query);
      const directionMatch = item.direction?.toLowerCase().includes(query);
      return gateMatch && (plateMatch || directionMatch);
    }),
    [records, search, gateFilter]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Historique</p>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Passages récents</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Recherche et filtration rapides par plaque, portail ou direction.</p>
      </div>
      <Card className="p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr]">
            <Input
              placeholder="Rechercher plaque, portail ou direction"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              value={gateFilter}
              onChange={(event) => setGateFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="all">Tous les portails</option>
              <option value="Portail 1">Portail 1</option>
              <option value="Portail 2">Portail 2</option>
              <option value="Portail 3">Portail 3</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="text-sm text-slate-500 dark:text-slate-400">{filteredRecords.length} enregistrements affichés</div>
            <HistoryExportButton records={filteredRecords} />
          </div>

        </div>
      </Card>
      <HistoryTable records={filteredRecords} />
    </div>
  );
};

export default HistoryPage;
