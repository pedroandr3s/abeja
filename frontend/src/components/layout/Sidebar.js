import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';

const Sidebar = ({ currentUser, roleConfig, theme, isDarkMode, isMobileOpen, onMobileToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected } = useApi();

  // Cerrar sidebar móvil al cambiar de ruta
  useEffect(() => {
    if (onMobileToggle && isMobileOpen) {
      onMobileToggle(false);
    }
  }, [location.pathname]);

  // Cerrar sidebar móvil al redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && onMobileToggle && isMobileOpen) {
        onMobileToggle(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen, onMobileToggle]);

  const handleMenuClick = (path) => {
    navigate(path);
    if (onMobileToggle) {
      onMobileToggle(false);
    }
  };

  const getCurrentPage = () => {
    return location.pathname;
  };

  const getUserInitials = () => {
    if (!currentUser) return 'U';
    const nombre = currentUser.nombre || '';
    const apellido = currentUser.apellido || '';
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  const getUserName = () => {
    if (!currentUser) return 'Usuario';
    return `${currentUser.nombre || ''} ${currentUser.apellido || ''}`.trim();
  };

  const getUserRole = () => {
    return roleConfig?.name || 'Sin rol';
  };

  const getUserLocation = () => {
    return currentUser?.ubicacion || currentUser?.ciudad || 'No especificada';
  };

  const getRoleColor = () => {
    switch (currentUser?.rol) {
      case 'ADM':
        return '#dc2626';
      case 'API':
        return '#059669';
      case 'INV':
        return '#2563eb';
      default:
        return '#6b7280';
    }
  };

  // Filtrar rutas según el rol del usuario
  const getAvailableRoutes = () => {
    if (currentUser?.rol === 'API') {
      // Los apicultores solo pueden ver el user-dashboard
      return roleConfig?.routes?.filter(route => route.path === '/user-dashboard') || [];
    }
    // Los administradores ven solo: Dashboard, Usuarios, Colmenas, Nodos
    if (currentUser?.rol === 'ADM') {
      const adminRoutes = [
        { path: '/dashboard', name: 'Dashboard', icon: '📊' },
        { path: '/usuarios', name: 'Usuarios', icon: '👥' },
        { path: '/colmenas', name: 'Colmenas', icon: '🏠' },
        
      ];
      return adminRoutes;
    }
    return [];
  };

  const availableRoutes = getAvailableRoutes();

  // Estilos dinámicos basados en el tema
  const sidebarStyles = {
    background: theme?.background || 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
    color: theme?.textPrimary || '#184036'
  };

  const cardStyles = {
    background: theme?.cardBackground || 'rgba(0, 0, 0, 0.2)',
    border: theme?.border || '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: theme?.shadow || '0 2px 8px rgba(0, 0, 0, 0.1)'
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <div className="sidebar" style={sidebarStyles}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🐝</span>
            <div className="logo-text">
              <h1 className="logo-title">SmartBee</h1>
              <p className="logo-subtitle">Sistema Apícola</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="sidebar-user-info" style={cardStyles}>
          <div 
            className="user-avatar"
            style={{ backgroundColor: getRoleColor() }}
          >
            {getUserInitials()}
          </div>
          <div className="user-details">
            <h3 className="user-name">{getUserName()}</h3>
            <p className="user-role">{getUserRole()}</p>
            <p className="user-location">📍 {getUserLocation()}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <h4 className="nav-section-title">
              {currentUser?.rol === 'API' ? 'Mi Panel' : 'Navegación'}
            </h4>
            <ul className="nav-list">
              {availableRoutes.map((route) => (
                <li key={route.path} className="nav-item">
                  <button
                    onClick={() => handleMenuClick(route.path)}
                    className={`nav-link ${getCurrentPage() === route.path ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{route.icon}</span>
                    <div className="nav-content">
                      <span className="nav-label">{route.name}</span>
                      {currentUser?.rol === 'ADM' && (
                        <span className="nav-description">
                          {getRouteDescription(route.path)}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* System Status - Solo para apicultores */}
          {currentUser?.rol === 'API' && (
            <div className="nav-section">
              <h4 className="nav-section-title">Estado del Sistema</h4>
              <div className="system-status">
                <div className="status-item">
                  <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`} />
                  <span className="status-text">
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                <div className="status-item">
                  <div className="status-indicator success" />
                  <span className="status-text">Sensores OK</span>
                </div>
                <div className="status-item">
                  <div className="status-indicator warning" />
                  <span className="status-text">2 Alertas</span>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="version-info">
            <p className="version-text">SmartBee v1.0.0</p>
            <p className="copyright">© 2024 Sistema Apícola</p>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="mobile-overlay" onClick={() => onMobileToggle && onMobileToggle(false)}>
          <div className="mobile-sidebar" style={sidebarStyles} onClick={e => e.stopPropagation()}>
            {/* Mobile Header */}
            <div className="mobile-header">
              <div className="mobile-logo">
                <span className="logo-icon">🐝</span>
                <span className="logo-title">SmartBee</span>
              </div>
              <button 
                className="mobile-close"
                onClick={() => onMobileToggle && onMobileToggle(false)}
              >
                ×
              </button>
            </div>

            {/* Mobile User Info */}
            <div className="mobile-user-info" style={cardStyles}>
              <div 
                className="mobile-user-avatar"
                style={{ backgroundColor: getRoleColor() }}
              >
                {getUserInitials()}
              </div>
              <div>
                <div className="mobile-user-name">{getUserName()}</div>
                <div className="mobile-user-role">{getUserRole()}</div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="mobile-nav">
              <div className="mobile-nav-section">
                <div className="mobile-nav-title">
                  {currentUser?.rol === 'API' ? 'Mi Panel' : 'Navegación'}
                </div>
                {availableRoutes.map((route) => (
                  <button
                    key={route.path}
                    onClick={() => handleMenuClick(route.path)}
                    className={`mobile-nav-item ${getCurrentPage() === route.path ? 'active' : ''}`}
                  >
                    <span className="mobile-nav-icon">{route.icon}</span>
                    <span className="mobile-nav-label">{route.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Status */}
            <div className="mobile-status">
              <div className="mobile-connection">
                <div className={`mobile-status-indicator ${isConnected ? 'online' : 'offline'}`} />
                <span>{isConnected ? 'Sistema Conectado' : 'Sistema Desconectado'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          color: white;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow-y: auto;
        }

        /* Header */
        .sidebar-header {
          padding: 1.5rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          font-size: 2rem;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-4px);
          }
          60% {
            transform: translateY(-2px);
          }
        }

        .logo-text {
          flex: 1;
        }

        .logo-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f59e0b;
          margin: 0;
        }

        .logo-subtitle {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        /* User Info */
        .sidebar-user-info {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-radius: 0.5rem;
          margin: 0.5rem;
          transition: all 0.2s ease;
        }

        .sidebar-user-info:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: white;
          font-weight: 600;
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 0.75rem;
          color: #f59e0b;
          font-weight: 500;
          margin: 0;
        }

        .user-location {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        /* Navigation */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem 0;
        }

        .nav-section {
          padding: 0.5rem 0;
        }

        .nav-section:not(:last-child) {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 0.5rem;
        }

        .nav-section-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.5rem 1rem;
          margin: 0 0 0.25rem 0;
        }

        .nav-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-item {
          margin: 0;
        }

        .nav-link {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          border: none;
          background: none;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          text-align: left;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateX(4px);
        }

        .nav-link.active {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border-right: 3px solid #f59e0b;
        }

        .nav-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #f59e0b;
        }

        .nav-icon {
          font-size: 1.25rem;
          min-width: 20px;
          text-align: center;
        }

        .nav-content {
          flex: 1;
          text-align: left;
        }

        .nav-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.2;
        }

        .nav-description {
          display: block;
          font-size: 0.75rem;
          opacity: 0.7;
          line-height: 1.2;
          margin-top: 0.125rem;
        }

        /* System Status */
        .system-status {
          padding: 0 1rem;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0;
          font-size: 0.75rem;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-indicator.online {
          background: #10b981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
        }

        .status-indicator.offline {
          background: #ef4444;
          box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
        }

        .status-indicator.warning {
          background: #f59e0b;
          box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
        }

        .status-indicator.success {
          background: #06d6a0;
          box-shadow: 0 0 6px rgba(6, 214, 160, 0.6);
        }

        .status-text {
          color: rgba(255, 255, 255, 0.8);
        }

        /* Quick Actions */
        .quick-actions {
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 0.375rem;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover {
          background: rgba(245, 158, 11, 0.2);
          border-color: rgba(245, 158, 11, 0.5);
          transform: translateY(-1px);
        }

        .quick-action-icon {
          font-size: 0.875rem;
        }

        .quick-action-text {
          font-weight: 500;
        }

        /* Footer */
        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: auto;
        }

        .version-info {
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .version-text {
          font-size: 0.75rem;
          color: #f59e0b;
          font-weight: 600;
          margin: 0;
        }

        .copyright {
          font-size: 0.625rem;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .footer-stats {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: #f59e0b;
          line-height: 1;
        }

        .stat-label {
          display: block;
          font-size: 0.625rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.125rem;
        }

        /* Mobile Styles */
        .mobile-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }

        .mobile-sidebar {
          width: 100%;
          max-width: 320px;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
          overflow-y: auto;
        }

        .mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mobile-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: all 0.2s ease;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .mobile-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: white;
          font-weight: 600;
          flex-shrink: 0;
        }

        .mobile-user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .mobile-user-role {
          font-size: 0.75rem;
          color: #f59e0b;
          font-weight: 500;
          margin: 0;
        }

        .mobile-nav {
          flex: 1;
          padding: 1rem 0;
          overflow-y: auto;
        }

        .mobile-nav-section {
          padding: 0 1rem;
        }

        .mobile-nav-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.5rem 0;
          margin-bottom: 0.5rem;
        }

        .mobile-nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 0.5rem;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          border-radius: 0.375rem;
          margin-bottom: 0.25rem;
        }

        .mobile-nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .mobile-nav-item.active {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .mobile-nav-icon {
          font-size: 1.25rem;
          min-width: 24px;
          text-align: center;
        }

        .mobile-nav-label {
          font-weight: 500;
          flex: 1;
        }

        .mobile-status {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .mobile-connection {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.375rem;
        }

        .mobile-status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .mobile-status-indicator.online {
          background: #10b981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
        }

        .mobile-status-indicator.offline {
          background: #ef4444;
          box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
        }

        /* Scrollbar */
        .sidebar-nav::-webkit-scrollbar,
        .mobile-nav::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav::-webkit-scrollbar-track,
        .mobile-nav::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }

        .sidebar-nav::-webkit-scrollbar-thumb,
        .mobile-nav::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.5);
          border-radius: 2px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb:hover,
        .mobile-nav::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.7);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }

          .mobile-overlay {
            display: flex;
            justify-content: flex-start;
          }

          .mobile-sidebar {
            animation: slideInLeft 0.3s ease-out;
          }

          @keyframes slideInLeft {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }
        }

        /* Animaciones */
        .nav-link {
          position: relative;
          overflow: hidden;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.5s;
        }

        .nav-link:hover::after {
          left: 100%;
        }

        .nav-link:active {
          transform: translateX(2px);
        }

        .user-avatar:hover {
          transform: scale(1.05);
          border-color: rgba(245, 158, 11, 0.5);
        }
      `}</style>
    </>
  );
};

// Función helper para descripciones de rutas
const getRouteDescription = (path) => {
  const descriptions = {
    '/dashboard': 'Panel principal del sistema',
    '/usuarios': 'Gestión de usuarios',
    '/colmenas': 'Administrar colmenas',
    '/revisiones': 'Monitoreo de nodos',
    '/user-dashboard': 'Panel personal del apicultor'
  };
  return descriptions[path] || '';
};

export default Sidebar;