import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import QRScanner from '../shared/QRScanner';
import './TopNav.css';

const TopNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, canViewModule } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const allMenuItems = [
    { path: '/dashboard', label: 'Dashboard', module: 'reports' },
    { path: '/catalog', label: 'Catalog', module: 'catalog' },
    { path: '/stock-by-location', label: 'Stock by Location', module: 'stock' },
    { path: '/vendors', label: 'Vendors', module: 'vendors' },
    { path: '/requisitions', label: 'Requisitions', module: 'requisitions' },
    { path: '/receiving', label: 'Receiving', module: 'receiving' },
    { path: '/counts', label: 'Counts', module: 'counts' },
    { path: '/reports', label: 'Reports & Alerts', module: 'reports' },
    { path: '/users', label: 'Users', module: null }, // Users is admin-only, no permission check
    { path: '/settings', label: 'Settings', module: null }, // Settings is admin-only, no permission check
  ];

  // Filter menu items based on permissions
  const menuItems = allMenuItems.filter(item => {
    if (item.module === null) {
      // Users - admin only, Settings - visible to all
      if (item.path === '/users') {
        return user?.role === 'ADMIN';
      }
      // Settings is visible to all authenticated users
      return true;
    }
    // Check view permission for module
    return canViewModule(item.module);
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="top-nav">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/">IMH</Link>
        </div>
        
        {/* Desktop Menu */}
        <div className="nav-menu-desktop">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/download"
            className={`nav-link ${isActive('/download') ? 'active' : ''}`}
          >
            📱 Download App
          </Link>
          {user && (
            <>
              <button 
                onClick={() => setShowQRScanner(true)} 
                className="nav-qr-scanner"
                title="Scan QR Code"
                aria-label="Scan QR Code"
              >
                📷 Scan
              </button>
              <span className="nav-user">({user.username})</span>
              <button onClick={handleLogout} className="nav-logout">
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="nav-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="nav-menu-mobile">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/download"
            className={`nav-link ${isActive('/download') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            📱 Download App
          </Link>
          {user && (
            <>
              <button 
                onClick={() => {
                  setShowQRScanner(true);
                  setIsMenuOpen(false);
                }} 
                className="nav-qr-scanner-mobile"
              >
                📷 Scan QR Code
              </button>
              <div className="nav-user-mobile">Logged in as: {user.username}</div>
              <button onClick={handleLogout} className="nav-logout-mobile">
                Logout
              </button>
            </>
          )}
        </div>
      )}

      {showQRScanner && (
        <QRScanner
          onClose={() => setShowQRScanner(false)}
          onScan={(code) => {
            setShowQRScanner(false);
            // Navigation is handled inside QRScanner component
          }}
        />
      )}
    </nav>
  );
};

export default TopNav;

