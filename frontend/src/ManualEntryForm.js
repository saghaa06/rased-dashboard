import React, { useState } from 'react';
import api from './api';
import { useAuth } from '../AuthContext';

const ManualEntryForm = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [plate, setPlate] = useState('');
  const [gate, setGate] = useState('Portail 1');
  const [direction, setDirection] = useState('in');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plate.trim()) {
      setError('La plaque est obligatoire');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/manual_entry/', { plate: plate.trim(), gate, direction });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l’enregistrement manuel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Ajouter un passage manuellement</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Plaque d’immatriculation</label>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="Ex: 1421211405"
              required
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
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Annuler</button>
            <button type="submit" disabled={loading}>Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryForm;