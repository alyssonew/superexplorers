import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Contact from './pages/Contact';
import Destinations from './pages/Destinations';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ManageDestinations from './pages/admin/ManageDestinations';
import ManageExpeditions from './pages/admin/ManageExpeditions';

import Expeditions from './pages/Expeditions';

const History = () => (
  <div className="py-40 text-center bg-stone-50 min-h-screen">
    <h1 className="text-6xl font-bold uppercase tracking-tighter text-zinc-900">Nossa História</h1>
    <p className="text-zinc-500 mt-10 uppercase tracking-widest text-xs font-bold">Desde 2010 explorando o extraordinário.</p>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/destinos" element={<PublicLayout><Destinations /></PublicLayout>} />
          <Route path="/expedicoes" element={<PublicLayout><Expeditions /></PublicLayout>} />
          <Route path="/historia" element={<PublicLayout><History /></PublicLayout>} />
          <Route path="/contato" element={<PublicLayout><Contact /></PublicLayout>} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
          <Route path="/admin/destinos" element={<AdminLayout><ManageDestinations /></AdminLayout>} />
          <Route path="/admin/expedicoes" element={<AdminLayout><ManageExpeditions /></AdminLayout>} />
          
          {/* Admin Redirects */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/contatos" element={<AdminLayout><div className="py-20 text-center">Gestão de Contatos em desenvolvimento.</div></AdminLayout>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
