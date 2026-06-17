import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState({
    total_vehicles: 0,
    today_count: 0,
    top_plates: [],
    last_7_days: [],
    vehicle_types: { Léger: 0, Utilitaire: 0, 'Poids-lourd': 0 }
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/stats/');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
  // DashboardAgent.js - reprend ton dashboard actuel + modal d'ajout manuel
const [showManualModal, setShowManualModal] = useState(false);
const [manualPlate, setManualPlate] = useState('');
const [manualGate, setManualGate] = useState('Portail 1');

const addManualEntry = async () => {
  await axios.post('http://127.0.0.1:8000/api/manual_entry/', {
    plate: manualPlate,
    gate: manualGate,
    direction: 'in'
  }, { headers: { Authorization: `Bearer ${token}` } });
  setShowManualModal(false);
  fetchHistory();
};
  return (
    <div style={{ padding: '20px' }}>
      <h2>Tableau de bord - Statistiques BI</h2>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', flex: 1 }}>
          <h3>Total véhicules détectés</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.total_vehicles}</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', flex: 1 }}>
          <h3>Aujourd'hui</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.today_count}</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Activité des 7 derniers jours</h3>
        <LineChart width={600} height={300} data={stats.last_7_days}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="count" stroke="#8884d8" />
        </LineChart>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Top 5 plaques les plus fréquentes</h3>
        <BarChart width={600} height={300} data={stats.top_plates}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="plate_text" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#82ca9d" />
        </BarChart>
      </div>

      <div>
        <h3>Catégorisation des véhicules</h3>
        <PieChart width={400} height={300}>
          <Pie
            data={Object.entries(stats.vehicle_types).map(([name, value]) => ({ name, value }))}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label
          >
            {Object.entries(stats.vehicle_types).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>
    </div>
  );
}

export default Dashboard;s