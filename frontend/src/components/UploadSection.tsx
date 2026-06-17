


import React, { useRef, useState } from 'react';

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
  const [predictedBox, setPredictedBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);


  const [openManual, setOpenManual] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const boxCanvasRef = useRef<HTMLCanvasElement | null>(null);


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
      const box = response.data.box || null;

      setPreview(detectedPlate || 'Aucune plaque détectée');
      setPredictedBox(box);

      // NOTE: do not keep the uploaded image on the page.
      // We show it only inside the toast modal after OK click.
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
                    onClick={() => {
                      // clear overlay canvas right after user confirms
                      try {
                        if (boxCanvasRef.current) {
                          const c = boxCanvasRef.current;
                          const ctx = c.getContext('2d');
                          if (ctx) ctx.clearRect(0, 0, c.width, c.height);
                        }
                      } catch {}
                      toast.dismiss(toastId);
                    }}
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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Image et reconnaissance</h2>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Fichier image</label>

            <div className="dropzone-card">
              <input
                type="file"
                accept="image/*"
                className="dropzone-input"
                onChange={(event) => {
                  const selected = event.target.files?.[0] || null;
                  setFile(selected);
                }}
              />
              <div className="dropzone-content">
                <div className="dropzone-title">Glissez-déposez ou sélectionnez</div>
                <div className="dropzone-subtitle">PNG / JPG / JPEG</div>
              </div>
            </div>
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

          {/* Do not display the uploaded image immediately after upload */}
          {preview && (
            <div className="mt-3" style={{ width: '100%', maxWidth: 520 }}>
              <div style={{ position: 'relative' }}>
                <img
                  ref={imgRef}
                  src={URL.createObjectURL(file as File)}
                  alt="Aperçu upload"
                  style={{ width: '100%', height: 360, objectFit: 'cover', borderRadius: 8 }}
                />
                <canvas
                  ref={boxCanvasRef}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: 360, pointerEvents: 'none' }}
                />
                <div className="mt-3 flex items-center justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      window.location.href = '/dashboard';
                    }}
                  >
                    OK
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* bbox overlay removed from this page; it is shown only in the toast modal */}


          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <Button type="submit" disabled={loading}>{loading ? 'Envoi...' : 'Envoyer l’image'}</Button>
            <Button type="button" variant="secondary" onClick={() => setOpenManual(true)}>Saisie manuelle</Button>
          </div>
        </form>
      </Card>


      <Card className="p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Capture locale</h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Utilisez une caméra locale et validez avant envoi.</p>
        </div>
      </Card>

      {openManual && <ManualEntry onClose={() => setOpenManual(false)} />}
    </div>
  );
};

export default UploadSection;
