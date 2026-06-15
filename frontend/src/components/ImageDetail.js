import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { formatPlateDetails, parseAlgerianPlate } from '../utils/plateParser';

const ImageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const plateInfo = useMemo(() => record ? parseAlgerianPlate(record.plate_text || '') : null, [record]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Try to fetch single record from history list and find the one with id
        const res = await api.get('/history/');
        const found = res.data.find((r) => String(r.id) === String(id));
        if (!found) {
          setError('Enregistrement introuvable');
          setLoading(false);
          return;
        }
        if (!mounted) return;
        setRecord(found);

        // Try to fetch annotated image (requires auth) as blob
        try {
          const imgRes = await api.get(`/annotated/${id}/`, { responseType: 'blob' });
          const url = URL.createObjectURL(imgRes.data);
          setImageSrc(url);
        } catch (e) {
          // fallback to public image_url if available
          if (found.image_url) setImageSrc(found.image_url);
        }
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="content"><p>Chargement...</p></div>;
  if (error) return (
    <div className="content">
      <p className="error">{error}</p>
      <button className="btn-secondary" onClick={() => navigate(-1)}>Retour</button>
    </div>
  );

  return (
    <div className="content">
      <div className="detail-header">
        <h2>Détail image #{record.id}</h2>
        <Link to="/" className="btn-secondary">Retour</Link>
      </div>
      <div className="detail-body">
        <div style={{ maxWidth: 800 }}>
          {imageSrc ? (
            <img src={imageSrc} alt={`record-${record.id}`} style={{ width: '100%', borderRadius: 6 }} />
          ) : (
            <div className="placeholder">Aucune image disponible</div>
          )}
        </div>
        <div className="detail-info">
          <p><strong>Plaque:</strong> {record.plate_text || 'Non détectée'}</p>
          {plateInfo && (
            <p className="plate-detail-summary"><strong>Détails décodés:</strong> {formatPlateDetails(plateInfo)}</p>
          )}
          <p><strong>Confiance:</strong> {record.confidence ? record.confidence.toFixed(2) : 'N/A'}</p>
          <p><strong>Portail:</strong> {record.gate || '—'}</p>
          <p><strong>Direction:</strong> {record.direction || '—'}</p>
          <p><strong>Entrée:</strong> {record.created_at ? new Date(record.created_at).toLocaleString('fr-FR') : '—'}</p>
          <p><strong>Sortie:</strong> {record.exit_time ? new Date(record.exit_time).toLocaleString('fr-FR') : '—'}</p>
          <p><strong>Durée (min):</strong> {record.duration_minutes ? record.duration_minutes.toFixed(1) : '—'}</p>
          <p><strong>Méthode:</strong> {record.entry_method}</p>
          <p><strong>Enregistré par:</strong> {record.entered_by || '—'}</p>
        </div>
      </div>
    </div>
  );
};

export default ImageDetail;
