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
    <div style={{ padding: '2rem' }} className="space-y-[1.5rem]">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Tableau de bord</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Synthèse des activités</p>
        </div>
        <Card className="p-6">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Caméras actives</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-100">
            {loading ? '—' : `${stats?.active_devices ?? '—'}`}
          </p>
        </Card>
      </div>

      <KPICards items={ka} />

      <div className="grid gap-6 xl:grid-cols-2">
        <TrafficChart data={lineData} />
        <PortailChart data={gateData} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Résumé des véhicules</h2>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Upload vidéo MP4</h2>
          </div>
          <VideoProcessOnDashboard />
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

