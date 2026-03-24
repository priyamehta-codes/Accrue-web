import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/newloader';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Accounts    from './pages/Accounts';
import Transactions from './pages/Transactions';
import Bills       from './pages/Bills';
import Splits      from './pages/Splits';
import Analytics   from './pages/Analytics';
import Landing     from './pages/Landing';

const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
      <Loader />
      <p style={{ color: 'var(--text-3)', fontWeight: 600, fontSize: '0.9rem' }}>Initialising Accrue...</p>
    </div>
  );
  return user ? <Navigate to="/dashboard" /> : <Landing />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
      <Route path="/splits" element={<ProtectedRoute><Splits /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
