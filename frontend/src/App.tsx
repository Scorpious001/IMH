import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import MobileLayout from './components/layout/MobileLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/Login/LoginPage';
import CatalogPage from './pages/Catalog/CatalogPage';
import ItemDetailPage from './pages/Catalog/ItemDetailPage';
import StockByLocationPage from './pages/StockByLocation/StockByLocationPage';
import VendorsPage from './pages/Vendors/VendorsPage';
import RequisitionsPage from './pages/Requisitions/RequisitionsPage';
import ReceivingPage from './pages/Receiving/ReceivingPage';
import CountsPage from './pages/Counts/CountsPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import UsersPage from './pages/Users/UsersPage';
import DownloadPage from './pages/Download/DownloadPage';
import './App.css';
import './styles/theme.css';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/catalog" replace /> : <LoginPage />
        }
      />
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? '/catalog' : '/login'} replace />
        }
      />
      <Route
        path="/catalog"
        element={
          <ProtectedRoute>
            <MobileLayout>
              <CatalogPage />
            </MobileLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/catalog/:id"
        element={
          <ProtectedRoute>
            <MobileLayout>
              <ItemDetailPage />
            </MobileLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock-by-location"
        element={
          <ProtectedRoute>
            <MobileLayout>
              <StockByLocationPage />
            </MobileLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendors"
        element={
          <ProtectedRoute>
            <MobileLayout>
              <VendorsPage />
            </MobileLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requisitions"
        element={
          <ProtectedRoute>
            <MobileLayout>
              <RequisitionsPage />
            </MobileLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/receiving"
        element={
          <ProtectedRoute>
            <MobileLayout>
              <ReceivingPage />
            </MobileLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/counts"
        element={
          <ProtectedRoute>
            <MobileLayout>
              <CountsPage />
            </MobileLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <MobileLayout>
              <ReportsPage />
            </MobileLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MobileLayout>
              <SettingsPage />
            </MobileLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <MobileLayout>
              <UsersPage />
            </MobileLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/download"
        element={
          <MobileLayout>
            <DownloadPage />
          </MobileLayout>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
