import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { parseAlgerianPlate } from '../utils/plateParser';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';

interface ManualEntryProps {
  onClose: () => void;
}

const ManualEntry: React.FC<ManualEntryProps> = ({ onClose }) => {
  const [plate, setPlate] = useState('');
  const [gate, setGate] = useState('Portail 1');
  const [direction, setDirection] = useState('in');
  const [loading, setLoading] = useState(false);

  const plateInfo = useMemo(() => parseAlgerianPlate(plate.trim()), [plate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plate.trim()) {
      toast.error('La plaque est obligatoire.');
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        plate: plate.trim(),
        gate,
        direction,
      };

      if (plateInfo) {
        payload.numero_enregistrement = plateInfo.registrationNumber;
        payload.vehicle_type = Number(plateInfo.typeCode || 0);
        payload.annee = plateInfo.year;
        payload.wilaya = plateInfo.wilaya;
      }

      await api.post('/manual_entry/', payload);
      toast.success('Entrée manuelle enregistrée.');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de l’enregistrement manuel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] bg-white p-6 shadow-soft dark:bg-slate-900">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Saisie manuelle</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">Ajouter un passage</h2>
          </div>
          <button type="button" className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" onClick={onClose}>Fermer</button>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Plaque d’immatriculation</label>
            <Input value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="Ex: 1421211405" />
            {plate.trim() && (
              <p className={`mt-2 text-sm ${plateInfo ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                {plateInfo
                  ? `Détecté : ${plateInfo.wilaya} • ${plateInfo.typeLabel} • ${plateInfo.year}`
                  : 'Plaque algérienne invalide — 10 chiffres requis.'}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Portail</label>
              <Select value={gate} onChange={(event) => setGate(event.target.value)}>
                <option>Portail 1</option>
                <option>Portail 2</option>
                <option>Portail 3</option>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntry;
