import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import api from '../api';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { useRole } from '../contexts/RoleContext';

const cameraSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  gate_number: z.number().min(1).max(10),
  is_active: z.boolean(),
});

type CameraForm = z.infer<typeof cameraSchema>;

interface CameraRecord {
  id: string | number;
  name: string;
  url: string;
  gate_number: number;
  is_active: boolean;
}

const CamerasList: React.FC = () => {
  const { isAdmin } = useRole();
  const [cameras, setCameras] = useState<CameraRecord[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<CameraForm>({
    resolver: zodResolver(cameraSchema),
    defaultValues: {
      name: '',
      url: '',
      gate_number: 1,
      is_active: true,
    },
  });

  const fetchCameras = async () => {
    try {
      const res = await api.get('/camera_settings/');
      setCameras(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const onSubmit = async (values: CameraForm) => {
    if (!isAdmin) {
      toast.error('Seul un administrateur peut modifier les caméras.');
      return;
    }

    try {
      setLoading(true);
      if (selectedCamera) {
        await api.patch(`/camera_settings/${selectedCamera.id}/`, values);
        toast.success('Caméra mise à jour.');
      } else {
        await api.post('/camera_settings/', values);
        toast.success('Caméra ajoutée.');
      }
      form.reset({ name: '', url: '', gate_number: 1, is_active: true });
      setSelectedCamera(null);
      fetchCameras();
    } catch (error) {
      console.error(error);
      toast.error('Impossible de sauvegarder la caméra.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (camera: CameraRecord) => {
    setSelectedCamera(camera);
    form.reset({
      name: camera.name,
      url: camera.url,
      gate_number: camera.gate_number,
      is_active: camera.is_active,
    });
  };

  const handleDelete = async (cameraId: string | number) => {
    if (!isAdmin) return;
    if (!window.confirm('Supprimer cette caméra ?')) return;

    try {
      await api.delete(`/camera_settings/${cameraId}/`);
      toast.success('Caméra supprimée.');
      setSelectedCamera(null);
      form.reset({ name: '', url: '', gate_number: 1, is_active: true });
      fetchCameras();
    } catch (error) {
      console.error(error);
      toast.error('Impossible de supprimer la caméra.');
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Caméras IP</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Gestion des caméras</h2>
        </div>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom de la caméra</label>
            <Input disabled={!isAdmin} {...form.register('name')} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">URL de flux</label>
            <Input disabled={!isAdmin} {...form.register('url')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Portail</label>
              <Select disabled={!isAdmin} {...form.register('gate_number', { valueAsNumber: true })}>
                {[1, 2, 3, 4].map((number) => (
                  <option key={number} value={number}>Portail {number}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
              <input id="active-toggle" type="checkbox" disabled={!isAdmin} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" {...form.register('is_active')} />
              <label htmlFor="active-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</label>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button type="submit" disabled={!isAdmin || loading}>{selectedCamera ? 'Mettre à jour' : 'Ajouter'}</Button>
            {!isAdmin && <p className="text-sm text-slate-500 dark:text-slate-400">Lecture seule pour les agents.</p>}
          </div>
        </form>
      </Card>
      <Card className="p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Caméras existantes</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Liste active</h2>
        </div>
        <div className="space-y-4">
          {cameras.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">Aucune caméra configurée.</div>
          ) : (
            cameras.map((camera) => (
              <div key={camera.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-slate-100">{camera.name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{camera.url}</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Portail {camera.gate_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" className="text-slate-700 dark:text-slate-200" onClick={() => handleSelect(camera)} disabled={!isAdmin}>Modifier</Button>
                    <Button type="button" variant="ghost" className="text-rose-600" onClick={() => handleDelete(camera.id)} disabled={!isAdmin}>Supprimer</Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default CamerasList;
