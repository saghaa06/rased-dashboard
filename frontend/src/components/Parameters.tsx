import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import api from '../api';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Card from './ui/Card';
import { useRole } from '../contexts/RoleContext';

const settingsSchema = z.object({
  confidence_threshold: z.number().min(0).max(1),
  history_retention_days: z.number().min(1).max(365),
  capture_interval_seconds: z.number().min(1).max(3600),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const Parameters: React.FC = () => {
  const { role, setRole, isAdmin } = useRole();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsForm | null>(null);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      confidence_threshold: 0.75,
      history_retention_days: 30,
      capture_interval_seconds: 10,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin_settings/');
        const payload = {
          confidence_threshold: Number(res.data.confidence_threshold ?? 0.75),
          history_retention_days: Number(res.data.history_retention_days ?? 30),
          capture_interval_seconds: Number(res.data.capture_interval_seconds ?? 10),
        };
        setSettings(payload);
        form.reset(payload);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSettings();
  }, []);

  const onSubmit = async (values: SettingsForm) => {
    try {
      setLoading(true);
      await api.patch('/admin_settings/', values);
      toast.success('Paramètres enregistrés.');
      setSettings(values);
    } catch (error) {
      console.error(error);
      toast.error('Impossible de sauvegarder les paramètres.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Paramètres système</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Configuration avancée</h2>
        </div>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Seuil de confiance</label>
            <Input type="number" step="0.01" min="0" max="1" {...form.register('confidence_threshold', { valueAsNumber: true })} disabled={!isAdmin} />
            {form.formState.errors.confidence_threshold && <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{form.formState.errors.confidence_threshold.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Conservation de l’historique (jours)</label>
            <Input type="number" min="1" max="365" {...form.register('history_retention_days', { valueAsNumber: true })} disabled={!isAdmin} />
            {form.formState.errors.history_retention_days && <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{form.formState.errors.history_retention_days.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Intervalle capture (s)</label>
            <Input type="number" min="1" max="3600" {...form.register('capture_interval_seconds', { valueAsNumber: true })} disabled={!isAdmin} />
            {form.formState.errors.capture_interval_seconds && <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{form.formState.errors.capture_interval_seconds.message}</p>}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" disabled={!isAdmin || loading}>{loading ? 'Sauvegarde...' : 'Enregistrer'}</Button>
            {!isAdmin && <p className="text-sm text-slate-500 dark:text-slate-400">Vous ne pouvez pas modifier ces valeurs en tant qu’agent.</p>}
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Rôle utilisateur</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Simulation de rôle</h2>
        </div>
        <div className="space-y-4">
          <Select value={role} onChange={(event) => setRole(event.target.value as 'admin' | 'agent')}>
            <option value="admin">Administrateur</option>
            <option value="agent">Agent</option>
          </Select>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Mode actuel : {role === 'admin' ? 'Administrateur' : 'Agent'}</p>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {role === 'admin'
                ? 'Tous les contrôles sont disponibles.'
                : 'Certaines actions sont désactivées pour préserver l’usage agent.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Parameters;
