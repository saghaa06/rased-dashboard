import React, { useEffect, useState } from 'react';
import api from '../api';

const CameraManagement = ({ canManage = false }) => {
  const [cameras, setCameras] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', url: '', gate_number: 1, is_active: true });
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const res = await api.get('/camera_settings/');
      setCameras(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const selectCamera = (camera) => {
    setForm({
      id: camera.id,
      name: camera.name,
      url: camera.url,
      gate_number: camera.gate_number,
      is_active: camera.is_active,
    });
    setError('');
  };

  const clearForm = () => {
    setForm({ id: null, name: '', url: '', gate_number: 1, is_active: true });
    setError('');
  };

  const saveCamera = async (e) => {
    e.preventDefault();
    if (!form.name || !form.url) {
      setError('Nom et URL obligatoires');
      return;
    }
    try {
      const data = {
        name: form.name,
        url: form.url,
        gate_number: Number(form.gate_number),
        is_active: form.is_active,
      };
      if (form.id) {
        await api.patch(`/camera_settings/${form.id}/`, data);
      } else {
        await api.post('/camera_settings/', data);
      }
      clearForm();
      refresh();
    } catch (err) {
      console.error(err);
      setError('Erreur de sauvegarde de la caméra');
    }
  };

  const deleteCamera = async (cameraId) => {
    if (!window.confirm('Supprimer cette caméra ?')) return;
    try {
      await api.delete(`/camera_settings/${cameraId}/`);
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="camera-management">
      <div className="section-header">
        <h3>Caméras IP</h3>
        {!canManage && <span className="subtle">Lecture seule pour les agents</span>}
      </div>

      {canManage && (
        <form className="camera-form" onSubmit={saveCamera}>
          <div className="form-group">
            <label>Nom</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Caméra portail 1" />
          </div>
          <div className="form-group">
            <label>URL</label>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="http://192.168.1.100/snapshot.jpg" />
          </div>
          <div className="form-group">
            <label>Portail</label>
            <select value={form.gate_number} onChange={(e) => setForm({ ...form, gate_number: e.target.value })}>
              <option value={1}>Portail 1</option>
              <option value={2}>Portail 2</option>
              <option value={3}>Portail 3</option>
            </select>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Actif
            </label>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="button-row">
            <button type="submit">{form.id ? 'Mettre à jour' : 'Ajouter'}</button>
            <button type="button" onClick={clearForm}>Réinitialiser</button>
          </div>
        </form>
      )}

      <div className="camera-list">
        <h4>Caméras existantes</h4>
        <table>
          <thead>
            <tr><th>Nom</th><th>URL</th><th>Portail</th><th>Actif</th><th>{canManage ? 'Actions' : 'Statut'}</th></tr>
          </thead>
          <tbody>
            {cameras.map((camera) => (
              <tr key={camera.id}>
                <td>{camera.name}</td>
                <td>{camera.url}</td>
                <td>{`Portail ${camera.gate_number}`}</td>
                <td>{camera.is_active ? 'Oui' : 'Non'}</td>
                <td>
                  {canManage ? (
                    <>
                      <button type="button" onClick={() => selectCamera(camera)}>Modifier</button>
                      <button type="button" onClick={() => deleteCamera(camera.id)}>Supprimer</button>
                    </>
                  ) : (
                    <span>{camera.is_active ? 'Actif' : 'Inactif'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CameraManagement;
