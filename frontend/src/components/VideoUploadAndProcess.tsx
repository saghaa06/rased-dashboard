import React, { useMemo, useRef, useState } from 'react';

import { toast } from 'react-hot-toast';
import api from '../api';
import Card from './ui/Card';
import Button from './ui/Button';
import Select from './ui/Select';
import Input from './ui/Input';

type GateOption = 'Portail 1' | 'Portail 2' | 'Portail 3';

const gateOptions: GateOption[] = ['Portail 1', 'Portail 2', 'Portail 3'];

// Frontend-only MP4 support (NO backend changes):
// - user uploads a video (mp4)
// - we extract frames in the browser (1 frame per second)
// - we POST each frame to existing `/upload/` endpoint as an image
// - we show a centered toast when we detect a plate in a frame
//
// Note: we cannot show true bounding boxes while playing because bounding box rendering
// requires detection outputs (boxes) from backend; the current `/upload/` only returns plate text.
const VideoUploadAndProcess: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [gate, setGate] = useState<GateOption>(gateOptions[0]);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [fpsHz, setFpsHz] = useState<number>(1);
  // For debugging: extract/save the first 10 frames as downloadable links in the browser console UI.
  const [debugSaveFirstN, setDebugSaveFirstN] = useState<number>(10);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const [processedCount, setProcessedCount] = useState(0);
  const [maxFrames, setMaxFrames] = useState(0);
  const [framesPreview, setFramesPreview] = useState<Array<{ id: string; t: number; plate: string; imageUrl: string | null }>>([]);

  // Debug: store the first N extracted frames as downloadable links.
  // This helps compare frame_0.jpg (video) vs a manually uploaded still via the image endpoint.

  const videoUrl = useMemo(() => {

    if (!videoFile) return '';
    return URL.createObjectURL(videoFile);
  }, [videoFile]);

  // Avoid leaking object URL when component re-renders/unmounts.
  const videoUrlRef = useRef<string>('');
  React.useEffect(() => {
    videoUrlRef.current = videoUrl;
    return () => {
      try {
        if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      } catch {}
    };
  }, [videoUrl]);

  const drawCenteredPlateToast = (plateText: string) => {
    const toastId = `video-detected-${Date.now()}`;

    toast.custom(
      () => (
        <div
          style={{
            position: 'fixed',
            inset: 0,
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
              <div className="flex-1 pt-1">
                <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Plaque détectée</div>
                <div className="mt-2 text-2xl font-extrabold tracking-tight text-[#0a2b3e] dark:text-[#6aa7ff]">
                  {plateText}
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
      { id: toastId, duration: Infinity }
    );
  };

  const extractFrameBlob = async (
    videoEl: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    timeSec: number
  ): Promise<Blob> => {
    // Seek
    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => resolve();
      const onError = () => reject(new Error('Failed to seek video frame'));

      videoEl.addEventListener('seeked', onSeeked, { once: true });
      videoEl.addEventListener('error', onError, { once: true });
      videoEl.currentTime = timeSec;
    });

    const w = videoEl.videoWidth;
    const h = videoEl.videoHeight;

    if (!w || !h) throw new Error('Video dimensions are not available');

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    ctx.drawImage(videoEl, 0, 0, w, h);

    const blob: Blob = await new Promise((resolve, reject) => {
      // Use PNG (lossless) to avoid JPEG blocking artifacts degrading CRNN+CTC accuracy.
      canvas.toBlob((b) => {
        if (!b) reject(new Error('Failed to create frame blob'));
        else resolve(b);
      }, 'image/png');

    });

    return blob;
  };

  const processVideo = async () => {
    if (!videoFile) {
      toast.error('Veuillez sélectionner un fichier vidéo MP4.');
      return;
    }

    // reset previews
    try {
      framesPreview.forEach((f) => {
        if (f.imageUrl && f.imageUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(f.imageUrl);
          } catch {}
        }
      });
    } catch {}

    setFramesPreview([]);

    setLoading(true);
    setStatus('Chargement vidéo...');
    setProcessedCount(0);
    setMaxFrames(0);

    try {
      const videoEl = document.createElement('video');
      videoEl.src = videoUrl;
      videoEl.crossOrigin = 'anonymous';
      videoEl.muted = true;

      // Wait metadata
      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => resolve();
        const onErr = () => reject(new Error('Failed to load video metadata'));
        videoEl.addEventListener('loadedmetadata', onLoaded, { once: true });
        videoEl.addEventListener('error', onErr, { once: true });
      });

      const duration = videoEl.duration; // seconds
      if (!duration || !isFinite(duration)) throw new Error('Invalid video duration');

      // Frame sampling:
      // Minimal improvement (fallback): still use time-based sampling, but do not force fpsHz=1 everywhere.
      // You can set fpsHz > 1 to increase density, or keep it at 1 to reduce motion blur.
      const stepSec = 1 / fpsHz;
      const times: number[] = [];
      for (let t = 0; t < duration; t += stepSec) times.push(t);


      setMaxFrames(times.length);

      const canvas = document.createElement('canvas');

      // Process sequentially (most reliable)
      for (let idx = 0; idx < times.length; idx++) {
        const t = times[idx];
        setStatus(`Traitement frame ${idx + 1} / ${times.length} (t=${t.toFixed(1)}s)`);

        const frameBlob = await extractFrameBlob(videoEl, canvas, t);
        const frameObjUrl = URL.createObjectURL(frameBlob);

        const formData = new FormData();
        // backend expects field name "image"
        const filename = `frame-${idx}-${Math.floor(t * 10)}.jpg`;
        formData.append('image', frameBlob, filename);
        formData.append('gate', gate);
        formData.append('direction', direction);

        const response = await api.post('/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const plate = response.data?.plate || '';
        setProcessedCount(idx + 1);

        setFramesPreview((prev) => [
          ...prev,
          {
            id: `${idx}-${Math.floor(t * 10)}`,
            t,
            plate,
            imageUrl: frameObjUrl,
          },
        ]);

        // still show toast for detected plates
        if (plate) drawCenteredPlateToast(plate);
      }

      setStatus('Terminé.');
      toast.success('Vidéo traitée avec succès.');
    } catch (err: any) {
      console.error(err);
      toast.error('Erreur pendant le traitement vidéo.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Upload</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Vidéo MP4 & détection (frames)</h2>
        </div>
        <span className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Nouveau</span>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Fichier vidéo</label>
          <input
            type="file"
            accept="video/mp4"
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Portail</label>
            <Select value={gate} onChange={(event) => setGate(event.target.value as GateOption)}>
              {gateOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Direction</label>
            <Select value={direction} onChange={(event) => setDirection(event.target.value as 'in' | 'out')}>
              <option value="in">Entrée</option>
              <option value="out">Sortie</option>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Rythme extraction</label>
            <Input
              type="number"
              min={1}
              step={1}
              value={fpsHz}
              onChange={(e) => {
                const v = Number(e.target.value);
                setFpsHz(Number.isFinite(v) && v > 0 ? v : 1);
              }}
              disabled
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Fixé à 1 frame / seconde (option la plus stable).</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Progression</label>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              {loading ? status || '—' : maxFrames ? `Traité: ${processedCount} / ${maxFrames}` : '—'}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" disabled={loading} onClick={processVideo}>
            {loading ? 'Traitement...' : 'Traiter la vidéo'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loading || !videoFile}
            onClick={() => {
              setVideoFile(null);
              setProcessedCount(0);
              setMaxFrames(0);
              setStatus('');
            }}
          >
            Réinitialiser
          </Button>
        </div>

        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
          Ici on extrait des frames (1 frame / seconde), on détecte la plaque pour chaque frame, et on affiche l’image + texte détecté à la fin.
        </p>

        {framesPreview.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Frames détectées (aperçu)
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {framesPreview.map((f) => (
                <div key={f.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">t={f.t.toFixed(1)}s</div>
                    <div className="text-xs font-bold text-[#0a2b3e] dark:text-[#6aa7ff]">
                      {f.plate ? f.plate : '—'}
                    </div>
                  </div>
                  {f.imageUrl ? (
                    <img
                      src={f.imageUrl}
                      alt={`Frame t=${f.t.toFixed(1)}s`}
                      className="h-40 w-full rounded-2xl border border-slate-200 object-cover dark:border-slate-700"
                    />
                  ) : (
                    <div className="h-40 w-full rounded-2xl bg-white dark:bg-slate-900" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VideoUploadAndProcess;

