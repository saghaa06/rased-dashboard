import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { parseAlgerianPlate, formatPlateDetails } from '../utils/plateParser';

const gateOptions = ['Portail 1', 'Portail 2', 'Portail 3'];

const LocalCameraCapture = ({ onSuccess }) => {
  const [gate, setGate] = useState('Portail 1');
  const [direction, setDirection] = useState('in');
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [plateInfo, setPlateInfo] = useState(null);

  const showPlateDetectedToast = (plate) => {
    const toastId = 'local-detected-plate';

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
            <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Plaque détectée</div>
            <div className="mt-2 text-2xl font-extrabold tracking-tight text-[#0a2b3e] dark:text-[#6aa7ff]">{plate}</div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Cliquez sur <span className="font-semibold">OK</span> pour continuer
            </div>

            <button
              type="button"
              className="mt-6 rounded-2xl bg-[#0a2b3e] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#0d3551] active:scale-[0.99]"
              onClick={() => toast.dismiss(toastId)}
            >
              OK
            </button>
          </div>
        </div>
      ),
      {
        id: toastId,
        duration: Infinity,
        style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
      }
    );
  };

  const handleCapture = async () => {
    setError('');
    setStatus('Connexion à la caméra locale...');
    setResult(null);
    setLoading(true);

    try {
      const response = await api.post('/capture_local/', {
        gate,
        direction,
        device_index: Number(deviceIndex),
      });
      setResult(response.data);

      const plate = response.data.plate || '';
      setStatus(
        plate
          ? `Plaque détectée : ${plate}`
          : 'Capture réussie, aucune plaque reconnue.'
      );

      if (plate) {
        const parsed = parseAlgerianPlate(plate);
        setPlateInfo(parsed);

        // Same UX as upload: centered toast + OK (but no image, since backend returns only plate+confidence)
        showPlateDetectedToast(plate);
      } else {
        setPlateInfo(null);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la capture depuis la caméra locale.');
      console.error('Capture error:', err);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-card">
      <h3>Capture caméra locale</h3>
      <p>Raspberry Pi : active la caméra et lance une capture dès qu’une plaque est détectée.</p>

      <div className="form-group">
        <label>Index de l’appareil</label>
        <input
          type="number"
          min="0"
          value={deviceIndex}
          onChange={(e) => setDeviceIndex(Number(e.target.value))}
        />
      </div>
      <div className="form-group">
        <label>Portail</label>
        <select value={gate} onChange={(e) => setGate(e.target.value)}>
          {gateOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Direction</label>
        <select value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="in">Entrée</option>
          <option value="out">Sortie</option>
        </select>
      </div>
      {error && <div className="error">{error}</div>}
      {status && <div className="success-message">{status}</div>}
      {result && (
        <div className="capture-result">
          <p><strong>Plaque :</strong> {result.plate || 'Non détectée'}</p>
          <p><strong>Confiance :</strong> {result.confidence?.toFixed(2) || 'N/A'}</p>
          <p><strong>Portail :</strong> {result.gate || gate}</p>
        </div>
      )}
      {plateInfo && (
        <div className="plate-details">
          <strong>Détails plaque :</strong> {formatPlateDetails(plateInfo)}
        </div>
      )}
      <button className="btn-primary" onClick={handleCapture} disabled={loading}>
        {loading ? 'Capture en cours...' : 'Lancer capture locale'}
      </button>
    </div>
  );
};

export default LocalCameraCapture;

