import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../api';
import { Link } from 'react-router-dom';
import { parseAlgerianPlate } from '../utils/plateParser';
import { useAuth } from '../AuthContext';
import CameraManagement from './CameraManagement';
import ImageUploadForm from './ImageUploadForm';
import LocalCameraCapture from './LocalCameraCapture';
import ManualEntryForm from './ManualEntryForm';
import VideoProcessOnDashboard from './VideoProcessOnDashboard';

const gateOptions = [
  { value: 'all', label: 'Tous les portails' },
  { value: 'Portail 1', label: 'Portail 1' },
  { value: 'Portail 2', label: 'Portail 2' },
  { value: 'Portail 3', label: 'Portail 3' },
];

const DashboardAgent = () => {
  const { user, logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState(localStorage.getItem('dashboardTheme') || 'light');
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [gateFilter, setGateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [settingsDraft, setSettingsDraft] = useState({});
  const [showManual, setShowManual] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, historyRes, settingsRes] = await Promise.all([
        api.get('/stats/'),
        api.get('/history/'),
        api.get('/admin_settings/'),
      ]);
      setStats(statsRes.data);
      setHistory(historyRes.data);
      setSettingsDraft(settingsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  useEffect(() => {
    localStorage.setItem('dashboardTheme', theme);
  }, [theme]);

  const filteredHistory = useMemo(
    () => history
      .filter((item) => gateFilter === 'all' || item.gate === gateFilter)
      .filter((item) =>
        item.plate_text?.toLowerCase().includes(search.toLowerCase()) ||
        item.gate?.toLowerCase().includes(search.toLowerCase()) ||
        item.direction?.toLowerCase().includes(search.toLowerCase())
      ),
    [history, gateFilter, search]
  );

  const getPlateInfo = (item) => parseAlgerianPlate(item.plate_text || item.numero_enregistrement || '');

  const exportToExcel = (rows, sheetName, fileName) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const exportKpis = () => {
    const rows = [
      { Métrique: 'Total véhicules', Valeur: stats?.total_vehicles ?? 0 },
      { Métrique: 'Entrées aujourd’hui', Valeur: stats?.today_count ?? 0 },
      { Métrique: 'Passages 24h', Valeur: filteredHistory.length },
    ];
    exportToExcel(rows, 'KPI', 'kpi_summary');
  };

  const exportHistory = () => {
    const rows = filteredHistory.map((item) => ({
      Plaque: item.plate_text,
      Portail: item.gate,
      Direction: item.direction,
      Date: new Date(item.created_at).toLocaleString('fr-FR'),
      Methode: item.entry_method,
    }));
    exportToExcel(rows, 'Historique', 'historique_agent');
  };

  const lineChartData = stats?.last_7_days?.map((item) => ({
    date: item.date,
    count: item.count,
  })) || [];

  const gateChartData = stats?.gate_counts?.map((item) => ({
    gate: item.gate || 'Inconnu',
    count: item.count,
  })) || [];

  const kpiItems = [
    { label: 'Véhicules présents', value: stats?.total_vehicles ?? '—' },
    { label: 'Entrées aujourd’hui', value: stats?.today_count ?? '—' },
    { label: 'Passages 24h', value: filteredHistory.length },
  ];

  return (
    <div className={`app-layout ${theme}`}>
      <aside className="sidebar open">
        <div className="sidebar-header">RASED Dashboard</div>
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Vue d’ensemble</button>
          <button className={`sidebar-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Historique</button>
          <button className={`sidebar-link ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>Upload & Camera</button>
          <button className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Paramètres</button>
        </nav>
        <div className="sidebar-section">
          <h4>Filtres portail</h4>
          {gateOptions.map((option) => (
            <button
              key={option.value}
              className={`sidebar-gate ${gateFilter === option.value ? 'active' : ''}`}
              onClick={() => setGateFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="sidebar-section">
          <h4>Thème</h4>
          <button className="btn-secondary" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Mode nuit' : 'Mode jour'}
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div>
            <h1>Tableau de bord Agent</h1>
            <p>Contrôle opérationnel, upload d’images et historique immédiat.</p>
          </div>
          <div className="user-info">
            <span>{user?.username}</span>
            <button className="btn-secondary" onClick={logout}>Déconnexion</button>
          </div>
        </header>

        <main className="content">
          {activeTab === 'overview' && (
            <>
              <section className="kpi-grid">
                {kpiItems.map((item) => (
                  <div key={item.label} className="kpi-card">
                    <div className="kpi-title">{item.label}</div>
                    <div className="kpi-value">{item.value}</div>
                  </div>
                ))}
              </section>
              <div className="action-row">
                <button className="btn-primary" onClick={exportKpis}>Exporter KPI</button>
                <button className="btn-secondary" onClick={fetchData}>Actualiser</button>
              </div>
              <section className="chart-grid">
                <div className="chart-card">
                  <h2>Trafic 7 derniers jours</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={lineChartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card">
                  <h2>Passages par portail</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={gateChartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="gate" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          )}

          {activeTab === 'history' && (
            <section className="history-section">
              <div className="history-header">
                <div>
                  <h2>Historique dernières 24h</h2>
                  <p>Filtre par portail ou recherche libre.</p>
                </div>
                <div className="filters">
                  <input
                    type="search"
                    placeholder="Rechercher plaque, portail ou direction"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button className="btn-export" onClick={exportHistory}>Exporter Excel</button>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Plaque</th>
                      <th>Type</th>
                      <th>Wilaya</th>
                      <th>Portail</th>
                      <th>Direction</th>
                      <th>Heure</th>
                      <th>Méthode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.image_url ? (
                            <Link to={`/image/${item.id}`}>
                              <img src={item.image_url} alt={item.plate_text || 'vehicle'} className="history-img" />
                            </Link>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td>{item.plate_text || '—'}</td>
                        <td>{getPlateInfo(item)?.typeLabel || item.vehicle_type || '—'}</td>
                        <td>{getPlateInfo(item)?.wilaya || item.wilaya || '—'}</td>
                        <td>{item.gate}</td>
                        <td>{item.direction}</td>
                        <td>{new Date(item.created_at).toLocaleString('fr-FR')}</td>
                        <td>{item.entry_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'upload' && (
            <section className="charts-row">
              <div className="chart-card">
                <h2>Upload d’images</h2>
                <ImageUploadForm onSuccess={fetchData} />
              </div>
              <div className="chart-card">
                <h2>Capture locale</h2>
                <LocalCameraCapture onSuccess={fetchData} />
              </div>
              <div className="chart-card">
                <h2>Vidéo MP4 (upload depuis PC)</h2>
                <VideoProcessOnDashboard />
              </div>
              <div className="chart-card">
                <h2>Entrée manuelle</h2>
                <p>Ajoutez un passage manuel pour test.</p>
                <button className="btn-primary" onClick={() => setShowManual(true)}>
                  Ouvrir le formulaire manuel
                </button>
              </div>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="settings-panel">
              <div className="section-header">
                <h2>Paramètres</h2>
              </div>
              <div className="settings-grid">
                <div className="kpi-card">
                  <div className="kpi-title">Mode</div>
                  <button className="btn-primary" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                    {theme === 'light' ? 'Activer mode nuit' : 'Activer mode jour'}
                  </button>
                </div>
                <div className="kpi-card">
                  <div className="kpi-title">Paramètres système</div>
                  <div className="form-group">
                    <label>Seuil confiance</label>
                    <input type="number" step="0.01" value={settingsDraft.confidence_threshold || ''} disabled />
                  </div>
                  <div className="form-group">
                    <label>Conservation historique</label>
                    <input type="number" value={settingsDraft.history_retention_days || ''} disabled />
                  </div>
                  <div className="form-group">
                    <label>Intervalle capture</label>
                    <input type="number" value={settingsDraft.capture_interval_seconds || ''} disabled />
                  </div>
                  <div className="success-message">Lecture seule pour les agents</div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'upload' && (
            <section className="history-section">
              <CameraManagement canManage={false} />
            </section>
          )}

        </main>
      </div>
      {showManual && (
        <ManualEntryForm
          onClose={() => setShowManual(false)}
          onSuccess={() => {
            setShowManual(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default DashboardAgent;
