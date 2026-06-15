import { useState } from 'react';
import ManualEntryForm from './ManualEntryForm';

// Dans ton composant DashboardAgent
const [showManualModal, setShowManualModal] = useState(false);

// Dans le retour JSX, ajoute un bouton :
<button onClick={() => setShowManualModal(true)}>➕ Ajouter manuellement</button>

// Et juste avant la fermeture du JSX :
{showManualModal && (
  <ManualEntryForm
    onClose={() => setShowManualModal(false)}
    onSuccess={() => { fetchHistory(); /* ou autre rafraîchissement */ }}
  />
)}