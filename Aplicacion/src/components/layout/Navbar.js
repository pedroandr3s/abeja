import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';

const Navbar = ({ currentUser, onLogout, roleConfig, onMobileMenuToggle }) => {
  const { isConnected, testConnection, loading } = useApi();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Cerrar menú móvil al cambiar de tamaño de pantalla
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRefresh = () => {
    testConnection();
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      console.log('👋 Cerrando sesión...');
      onLogout();
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    if (!currentUser) return 'Sin rol';
    return currentUser.rol_nombre || roleConfig?.name || 'Sin rol';
  };

  const getRoleColor = () => {
    if (!currentUser) return '#6b7280';
    
    switch (currentUser.rol) {
      case 'ADM':
        return '#dc2626'; // Rojo para administrador
      case 'API':
        return '#059669'; // Verde para apicultor
      case 'INV':
        return '#2563eb'; // Azul para investigador
      default:
        return '#6b7280'; // Gris por defecto
    }
  };

  // Determinar si mostrar funciones de admin
  const isAdmin = currentUser?.rol === 'ADM';

  return (
    <>
      <div className="navbar">
        <div className="navbar-content">
          {/* Sección izquierda - Logo y título */}
          <div className="navbar-left">
            {/* Botón hamburguesa para móvil */}
            <button
              className="mobile-menu-button"
              onClick={onMobileMenuToggle}
            >
              <svg
                className="hamburger-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="navbar-title">
              <h1>
                Sistema de Gestión Apícola
              </h1>
              <p className="navbar-subtitle">
                {isAdmin ? 'Panel de Administración' : 'Monitoreo de Colmenas'}
              </p>
            </div>
          </div>

          {/* Sección derecha - Controles */}
          <div className="navbar-right">
            {/* Hora actual - Solo en desktop */}
            <div className="current-time">
              <div className="time-display">
                {getCurrentTime()}
              </div>
            </div>

            {/* Estado de conexión */}
            <div className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
              <div className="status-indicator" />
              <span className="status-text">
                {isConnected ? 'Backend Online' : 'Backend Offline'}
              </span>
            </div>

            {/* Botón actualizar - Solo para admin */}
            {isAdmin && (
              <button
                onClick={handleRefresh}
                disabled={loading}
                className={`refresh-button ${loading ? 'loading' : ''}`}
              >
                <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>
                  🔄
                </span>
                <span className="refresh-text">
                  {loading ? 'Conectando...' : 'Actualizar'}
                </span>
              </button>
            )}

            {/* Información del usuario */}
            <div className="user-info">
              {/* Avatar */}
              <div 
                className="user-avatar"
                style={{ backgroundColor: getRoleColor() }}
              >
                {getUserInitials()}
              </div>
              
              {/* Detalles del usuario - Solo en desktop */}
              <div className="user-details">
                <div className="user-name">
                  {getUserName()}
                </div>
                <div 
                  className="user-role"
                  style={{ color: getRoleColor() }}
                >
                  {getUserRole()}
                </div>
              </div>
              
              {/* Botón logout */}
              <button
                onClick={handleLogout}
                className="logout-button"
                title="Cerrar Sesión"
              >
                🚪
              </button>
            </div>

            {/* Indicador de sesión activa - Solo para admin */}
            {isAdmin && currentUser && (
              <div className="session-indicator">
                <div className="session-dot" />
                <span>Sesión Activa</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menú móvil overlay - Solo mostrar si isMobileMenuOpen existe y es true */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            {/* Header del menú móvil */}
            <div className="mobile-menu-header">
              <div className="mobile-user-info">
                <div 
                  className="mobile-user-avatar"
                  style={{ backgroundColor: getRoleColor() }}
                >
                  {getUserInitials()}
                </div>
                <div>
                  <div className="mobile-user-name">{getUserName()}</div>
                  <div 
                    className="mobile-user-role"
                    style={{ color: getRoleColor() }}
                  >
                    {getUserRole()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-menu-close"
              >
                ×
              </button>
            </div>

            {/* Información adicional en móvil */}
            <div className="mobile-menu-content">
              {/* Estado de conexión */}
              <div className="mobile-connection-status">
                <div className={`connection-indicator ${isConnected ? 'online' : 'offline'}`}>
                  <div className="status-dot" />
                  <span>{isConnected ? 'Conectado al Backend' : 'Desconectado del Backend'}</span>
                </div>
              </div>

              {/* Hora actual */}
              <div className="mobile-time">
                <div className="time-label">Hora actual:</div>
                <div className="time-value">{getCurrentTime()}</div>
              </div>

              {/* Botones de acción */}
              <div className="mobile-actions">
                {isAdmin && (
                  <button
                    onClick={() => {
                      handleRefresh();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={loading}
                    className={`mobile-action-button ${loading ? 'loading' : ''}`}
                  >
                    <span className={`action-icon ${loading ? 'spinning' : ''}`}>🔄</span>
                    {loading ? 'Conectando...' : 'Actualizar Conexión'}
                  </button>
                )}
                
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mobile-action-button logout"
                >
                  <span className="action-icon">🚪</span>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style >{`
        .navbar {
          background: #184036;
          border-bottom: 1px solid #e5e7eb;
          padding: 0.75rem 1rem;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .navbar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 100%;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 0.375rem;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .mobile-menu-button:hover {
          background-color: #f3f4f6;
          color: #374151;
        }

        .hamburger-icon {
          width: 1.5rem;
          height: 1.5rem;
        }

        .navbar-title h1 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffffff;
          margin: 0;
          margin-bottom: 0.125rem;
        }

        .navbar-subtitle {
          font-size: 0.875rem;
          color: #ffffffff;
          margin: 0;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .current-time {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .time-display {
          font-size: 0.875rem;
          font-weight: 500;
          color: #ffffffff;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          border: 1px solid;
          transition: all 0.2s ease;
        }

        .connection-status.online {
          background-color: #ecfdf5;
          border-color: #d1fae5;
        }

        .connection-status.offline {
          background-color: #fef2f2;
          border-color: #fee2e2;
        }

        .status-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .connection-status.online .status-indicator {
          background-color: #10b981;
        }

        .connection-status.offline .status-indicator {
          background-color: #ef4444;
        }

        .status-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .connection-status.online .status-text {
          color: #059669;
        }

        .connection-status.offline .status-text {
          color: #dc2626;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-button:hover:not(.loading) {
          background-color: #e5e7eb;
          border-color: #9ca3af;
        }

        .refresh-button.loading {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .refresh-icon {
          font-size: 0.875rem;
          transition: transform 0.5s ease;
        }

        .refresh-icon.spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1f2937;
        }

        .user-role {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .logout-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
          color: #6b7280;
          font-size: 1.125rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .logout-button:hover {
          background-color: #fee2e2;
          color: #dc2626;
          transform: scale(1.05);
        }

        .session-indicator {
          font-size: 0.75rem;
          color: #059669;
          background-color: #ecfdf5;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          border: 1px solid #d1fae5;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .session-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #10b981;
        }

        /* Menú móvil */
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 100;
          display: flex;
          justify-content: flex-end;
        }

        .mobile-menu {
          background-color: #ffffff;
          width: 100%;
          max-width: 20rem;
          box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
        }

        .mobile-menu-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .mobile-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
          font-weight: 600;
        }

        .mobile-user-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .mobile-user-role {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .mobile-menu-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: all 0.2s ease;
        }

        .mobile-menu-close:hover {
          background-color: #f3f4f6;
          color: #374151;
        }

        .mobile-menu-content {
          padding: 1rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .mobile-connection-status {
          padding: 1rem;
          border-radius: 0.5rem;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .connection-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .connection-indicator.online {
          color: #059669;
        }

        .connection-indicator.offline {
          color: #dc2626;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .connection-indicator.online .status-dot {
          background-color: #10b981;
        }

        .connection-indicator.offline .status-dot {
          background-color: #ef4444;
        }

        .mobile-time {
          text-align: center;
        }

        .time-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .time-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1f2937;
        }

        .mobile-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .mobile-action-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background-color: #ffffff;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mobile-action-button:hover:not(.loading) {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .mobile-action-button.logout {
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .mobile-action-button.logout:hover {
          background-color: #fee2e2;
          border-color: #fca5a5;
        }

        .mobile-action-button.loading {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-icon {
          font-size: 1rem;
        }

        .action-icon.spinning {
          animation: spin 1s linear infinite;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .navbar {
            padding: 0.5rem 1rem;
          }

          .mobile-menu-button {
            display: block;
          }

          .navbar-title h1 {
            font-size: 1rem;
          }

          .navbar-subtitle {
            font-size: 0.75rem;
          }

          .current-time {
            display: none;
          }

          .refresh-text {
            display: none;
          }

          .user-details {
            display: none;
          }

          .session-indicator {
            display: none;
          }

          .connection-status {
            padding: 0.375rem 0.5rem;
          }

          .status-text {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 640px) {
          .navbar-right {
            gap: 0.5rem;
          }

          .refresh-button {
            padding: 0.375rem 0.5rem;
          }

          .status-text {
            display: none;
          }

          .user-info {
            padding: 0.25rem;
            gap: 0.5rem;
          }

          .mobile-menu {
            max-width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;