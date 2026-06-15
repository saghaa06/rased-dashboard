import React, { useState } from 'react';
import api from '../api';
import { parseAlgerianPlate, formatPlateDetails } from '../utils/plateParser';

const ImageUploadForm = ({ onSuccess }) => {
  const [file, setFile] = useState(null);
  const [gate, setGate] = useState('Portail 1');
  const [direction, setDirection] = useState('in');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [plateInfo, setPlateInfo] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!file) {
      setError('Veuillez sélectionner un fichier image.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('gate', gate);
    formData.append('direction', direction);

    try {
      setUploading(true);
      const response = await api.post('/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const plate = response.data.plate || '';
      setStatus(`Image envoyée avec succès (${plate || 'sans plaque détectée'})`);
      setFile(null);
      if (plate) {
        const parsed = parseAlgerianPlate(plate);
        setPlateInfo(parsed);
      } else {
        setPlateInfo(null);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Erreur lors de l’envoi de l’image. Vérifiez le format et réessayez.');
      setPlateInfo(null);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-card">
      <h3>Upload image AI</h3>
      <p>Transmettez une image de véhicule pour test et stockage dans l’historique.</p>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="form-group">
          <label>Portail</label>
          <select value={gate} onChange={(e) => setGate(e.target.value)}>
            <option>Portail 1</option>
            <option>Portail 2</option>
            <option>Portail 3</option>
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
        {plateInfo && (
          <div className="plate-details">
            <strong>Détails plaque :</strong> {formatPlateDetails(plateInfo)}
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={uploading}>
          {uploading ? 'Envoi...' : 'Envoyer l’image'}
        </button>
      </form>
    </div>
  );
};

export default ImageUploadForm;
