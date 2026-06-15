import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import Button from './ui/Button';
import Card from './ui/Card';
import Select from './ui/Select';

const gateOptions = ['Portail 1', 'Portail 2', 'Portail 3'];

const CaptureLocal: React.FC = () => {
  const [gate, setGate] = useState(gateOptions[0]);
  const [direction, setDirection] = useState('in');
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleCapture = async () => {
    try {
      setLoading(true);
      const response = await api.post('/capture_local/', {
        gate,
        direction,
        device_index: deviceIndex,
      });
      setResult(response.data.plate || 'Aucune plaque détectée.');
      toast.success('Capture locale terminée.');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la capture locale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Capture locale</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Caméra locale</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Index appareil</label>
          <input
            type="number"
            min={0}
            value={deviceIndex}
            onChange={(event) => setDeviceIndex(Number(event.target.value))}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Portail</label>
            <Select value={gate} onChange={(event) => setGate(event.target.value)}>
              {gateOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Direction</label>
            <Select value={direction} onChange={(event) => setDirection(event.target.value)}>
              <option value="in">Entrée</option>
              <option value="out">Sortie</option>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button onClick={handleCapture} disabled={loading}>{loading ? 'Capture en cours...' : 'Lancer la capture'}</Button>
        </div>
        {result && <p className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-200">Résultat : {result}</p>}
      </div>
    </Card>
  );
};

export default CaptureLocal;
