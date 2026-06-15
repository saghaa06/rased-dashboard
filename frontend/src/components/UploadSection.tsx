

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import ManualEntry from './ManualEntry';

const gateOptions = ['Portail 1', 'Portail 2', 'Portail 3'];

const UploadSection: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [gate, setGate] = useState(gateOptions[0]);
  const [direction, setDirection] = useState('in');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [openManual, setOpenManual] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast.error('Veuillez sélectionner une image avant de continuer.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('gate', gate);
    formData.append('direction', direction);

    try {
      setLoading(true);
      const response = await api.post('/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const detectedPlate = response.data.plate || '';
      setPreview(detectedPlate || 'Aucune plaque détectée');
      setFile(null);

      // Notification: mini image + texte plaque détectée + OK (fermeture)
      if (detectedPlate) {
        const toastId = 'upload-detected-plate';
        const imageUrl = URL.createObjectURL(file as File);

        toast.custom(
          () => (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
              role="dialog"
              aria-modal="true"
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'transparent',
                }}
                onClick={() => toast.dismiss(toastId)}
              />

              <div
                className="relative w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-900"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-6">
                  <img
                    src={imageUrl}
                    alt="Aperçu"
                    className="h-28 w-28 rounded-[20px] object-cover border border-slate-200 dark:border-slate-700"
                    onLoad={() => {
                      try {
                        URL.revokeObjectURL(imageUrl);
                      } catch {}
                    }}
                  />

                  <div className="flex-1 pt-1">
                    <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                      Plaque détectée
                    </div>
                    <div className="mt-2 text-2xl font-extrabold tracking-tight text-[#0a2b3e] dark:text-[#6aa7ff]">
                      {detectedPlate}
                    </div>
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Cliquez sur <span className="font-semibold">OK</span> pour continuer
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rounded-2xl bg-[#0a2b3e] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#0d3551] active:scale-[0.99]"
                    onClick={() => toast.dismiss(toastId)}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          ),
          {
            id: toastId,
            duration: Infinity,
            // critical: ignore toast placement entirely
            style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
          }
        );
      } else {
        toast.success('Image envoyée avec succès.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de l’envoi de l’image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Upload</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Image et reconnaissance</h2>
          </div>
          <span className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Nouveau</span>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Fichier image</label>
            <input
              type="file"
              accept="image/*"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              onChange={(event) => {
                const selected = event.target.files?.[0] || null;
                setFile(selected);
              }}
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
          {preview && <p className="text-sm text-slate-600 dark:text-slate-300">Résultat : {preview}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" disabled={loading}>{loading ? 'Envoi...' : 'Envoyer l’image'}</Button>
            <Button type="button" variant="secondary" onClick={() => setOpenManual(true)}>Saisie manuelle</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Assistance rapide</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Capture locale</h3>
          </div>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Lancer une capture depuis une caméra locale et vérifier les résultats avant envoi.</p>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Fonctionnalité intégrée</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Activez la caméra locale et récoltez un aperçu instantané.</p>
          </div>
        </div>
      </Card>

      {openManual && <ManualEntry onClose={() => setOpenManual(false)} />}
    </div>
  );
};

export default UploadSection;
