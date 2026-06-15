import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import KPICards from '../components/KPICards';
import { TrafficChart, PortailChart } from '../components/Charts';
import Card from '../components/ui/Card';
import VideoProcessOnDashboard from '../components/VideoProcessOnDashboard';


interface StatPoint {
  date: string;
  count: number;
}

interface GateCount {
  gate: string;
  count: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, adminRes] = await Promise.all([api.get('/stats/'), api.get('/admin_stats/')]);
        setStats(statsRes.data);
        setAdminStats(adminRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

type KpiAccent = 'blue' | 'green' | 'orange' | 'purple';

type KpiItemLocal = {
  label: string;
  value: string | number;
  accent: KpiAccent;
};

  const ka = useMemo(
    () =>
      [
        { label: 'Véhicules présents', value: stats?.total_vehicles ?? '—', accent: 'blue' as const },
        { label: 'Entrées aujourd’hui', value: stats?.today_count ?? '—', accent: 'green' as const },
        { label: 'Passages 24h', value: adminStats?.last_24h ?? '—', accent: 'orange' as const },
        { label: 'Portails actifs', value: stats?.gate_counts?.length ?? '—', accent: 'purple' as const },
      ] as KpiItemLocal[],
    [stats, adminStats]
  );

  const lineData = (stats?.last_7_days ?? []) as StatPoint[];
  const gateData = (stats?.gate_counts ?? []) as GateCount[];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Vue d’ensemble</p>
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Tableau de bord</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Les indicateurs clés et les tendances du trafic sont affichés ici pour une supervision rapide.
          </p>
        </div>
        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Temps réel</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-100">
            {loading ? 'Chargement…' : `${stats?.active_devices ?? '—'} caméras actives`}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Données synchronisées avec le backend.</p>
        </Card>
      </div>

      <div className="relative">
        <KPICards items={ka} />
      </div>


      <div className="grid gap-6 xl:grid-cols-2">
        <TrafficChart data={lineData} />
        <PortailChart data={gateData} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Statistiques détaillées</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">Résumé des véhicules</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Les statistiques sont basées sur les données récoltées par le système.</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Nouveau</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">Upload vidéo MP4</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Le système extrait des frames (1/s), détecte la plaque et enregistre dans l’historique.
            </p>
          </div>
          <VideoProcessOnDashboard />
        </Card>
      </div>

    </div>
  );
};

export default DashboardPage;

