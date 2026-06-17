import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';
import { parseAlgerianPlate, formatPlateDetails } from '../utils/plateParser';

const gateOptions = ['Portail 1', 'Portail 2', 'Portail 3'];

/**
 * Live demo (simple + fast):
 * - show webcam in <video>
 * - every `intervalMs` capture a frame into a canvas
 * - POST the frame to backend `/api/upload/` (field name: `image`)
 * - backend returns `{ plate, confidence, box: {x,y,w,h}}`
 * - draw bbox + predicted plate on a transparent overlay canvas
 *
 * Note: This is optimized for a demo, not production.
 */
const LocalCameraLiveBoxCapture = ({ intervalMs = 600, onSuccess = undefined }) => {
  const [gate, setGate] = useState(gateOptions[0]);
  const [direction, setDirection] = useState('in');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const [plate, setPlate] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [plateInfo, setPlateInfo] = useState(null);

  const [box, setBox] = useState(null); // {x,y,w,h}

  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const isRunningRef = useRef(false);
  const busyRef = useRef(false);

  const startStream = async () => {
    setError('');
    setStatus('');

    if (streamRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia non supporté par ce navigateur');
    }

    // Facing mode: try user by default
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  };

  const stopStream = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    } catch {}
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const drawOverlay = (drawBox, drawPlate) => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure canvas size matches displayed video size
    const displayW = video.clientWidth;
    const displayH = video.clientHeight;

    if (!displayW || !displayH) return;

    if (canvas.width !== displayW) canvas.width = displayW;
    if (canvas.height !== displayH) canvas.height = displayH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!drawBox) return;

    // Backend box is in source image pixel coordinates.
    // We captured from canvas that matches video intrinsic dimensions.
    // Scale factors from intrinsic -> displayed.
    const intrinsicW = video.videoWidth || displayW;
    const intrinsicH = video.videoHeight || displayH;

    const sx = displayW / intrinsicW;
    const sy = displayH / intrinsicH;

    const x = drawBox.x * sx;
    const y = drawBox.y * sy;
    const w = drawBox.w * sx;
    const h = drawBox.h * sy;

    ctx.lineWidth = Math.max(2, 3 * Math.min(sx, sy));
    ctx.strokeStyle = '#22c55e';
    ctx.fillStyle = 'rgba(34,197,94,0.15)';

    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    if (drawPlate) {
      ctx.font = `bold ${Math.max(14, 16 * sx)}px Arial`;
      const text = drawPlate;
      const padding = 6;
      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      const textH = 18;

      const bx = x;
      const by = Math.max(0, y - textH - padding);

      ctx.fillStyle = 'rgba(10,43,62,0.85)';
      ctx.fillRect(bx, by, textW + padding * 2, textH + padding);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, bx + padding, by + textH);
    }
  };

  const captureAndSendFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Capture using intrinsic video resolution
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (!b) reject(new Error('toBlob failed'));
        else resolve(b);
      }, 'image/png');
    });

    const formData = new FormData();
    const filename = `live-${Date.now()}.png`;
    formData.append('image', blob, filename);
    formData.append('gate', gate);
    formData.append('direction', direction);

    const response = await api.post('/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = response.data || {};
    const nextPlate = data.plate || '';
    const nextConf = typeof data.confidence === 'number' ? data.confidence : null;
    const nextBox = data.box || null;

    setPlate(nextPlate);
    setConfidence(nextConf);
    setBox(nextBox);

    if (nextPlate) {
      setPlateInfo(parseAlgerianPlate(nextPlate));
    }

    if (nextPlate) {
      drawOverlay(nextBox, nextPlate);
      if (onSuccess) onSuccess();
    } else {
      drawOverlay(nextBox, '');
    }
  };

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      busyRef.current = false;
      stopStream();
    };
  }, []);

  useEffect(() => {
    // Draw empty overlay initially
    drawOverlay(null, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    isRunningRef.current = true;

    let timer = null;
    let cancelled = false;

    (async () => {
      try {
        await startStream();
        setStatus('Caméra active. Détection...');

        // main loop
        timer = setInterval(async () => {
          if (cancelled) return;
          if (!isRunningRef.current) return;
          if (busyRef.current) return;

          busyRef.current = true;
          try {
            await captureAndSendFrame();
          } catch (e) {
            console.error('capture/send failed', e);
          } finally {
            busyRef.current = false;
          }
        }, intervalMs);
      } catch (e) {
        console.error(e);
        setError(e?.message || 'Erreur caméra');
        setStatus('');
        setEnabled(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      isRunningRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, gate, direction]);

  return (
    <div className="upload-card">
      <h3>Caméra locale (LIVE bbox + texte)</h3>
      <p>Démo soutenance: bbox + “Predicted” quand une plaque est détectée.</p>

      <div className="form-group" style={{ marginTop: 10 }}>
        <label>Portail</label>
        <select value={gate} onChange={(e) => setGate(e.target.value)}>
          {gateOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
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

      {error ? <div className="error">{error}</div> : null}
      {status ? <div className="success-message">{status}</div> : null}

      <div style={{ position: 'relative', width: '100%', maxWidth: 720, marginTop: 12 }}>
        <video ref={videoRef} style={{ width: '100%', borderRadius: 12, background: '#0b2236' }} />
        <canvas
          ref={overlayRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          className="btn-primary"
          onClick={() => setEnabled(true)}
          disabled={enabled || loading}
        >
          Démarrer LIVE
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            setEnabled(false);
            stopStream();
            setStatus('');
            setPlate('');
            setConfidence(null);
            setBox(null);
            setPlateInfo(null);
          }}
          disabled={!enabled}
          style={{ background: '#334155' }}
        >
          Stop
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <p>
          <strong>Predicted:</strong> {plate || '—'}
          {confidence !== null ? ` (conf ${confidence.toFixed(2)})` : ''}
        </p>
        {plateInfo ? (
          <div>
            <strong>Détails:</strong> {formatPlateDetails(plateInfo)}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default LocalCameraLiveBoxCapture;

