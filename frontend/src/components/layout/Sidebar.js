import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';

const Sidebar = ({ 
  currentPage, 
  currentUser, 
  roleConfig, 
  theme, 
  isDarkMode 
}) => {
  const navigate = useNavigate();
  const { isConnected } = useApi();

  // Determinar si es administrador o apicultor
  const isAdmin = currentUser?.rol === 'ADM';
  const isApicultor = currentUser?.rol === 'API';

  // Items del menú basados en el rol
  const menuItems = isAdmin ? [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      path: '/dashboard',
      description: 'Panel principal'
    },
    { 
      id: 'usuarios', 
      label: 'Usuarios', 
      icon: '👥',
      path: '/usuarios',
      description: 'Gestión de usuarios'
    },
    { 
      id: 'colmenas', 
      label: 'Colmenas', 
      icon: '🏠',
      path: '/colmenas',
      description: 'Administrar colmenas'
    },
    { 
      id: 'revisiones', 
      label: 'Nodos', 
      icon: '📋',
      path: '/revisiones',
      description: 'Monitoreo de nodos'
    }
  ] : [
    { 
      id: 'user-dashboard', 
      label: 'Mi Dashboard', 
      icon: '📊',
      path: '/user-dashboard',
      description: 'Panel de control personal'
    },
    { 
      id: 'user-colmenas', 
      label: 'Mis Colmenas', 
      icon: '🏠',
      path: '/user-colmenas',
      description: 'Gestionar mis colmenas'
    },
    { 
      id: 'user-reportes', 
      label: 'Reportes', 
      icon: '📈',
      path: '/user-reportes',
      description: 'Informes y análisis'
    },
    { 
      id: 'user-profile', 
      label: 'Mi Perfil', 
      icon: '👤',
      path: '/user-profile',
      description: 'Configuración personal'
    }
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  // Obtener el id de la página actual desde el path
  const getCurrentPageId = () => {
    if (currentPage.startsWith('user-')) {
      return currentPage;
    }
    return currentPage;
  };

  const currentPageId = getCurrentPageId();

  return (
    <div style={{
      width: '280px',
      height: '100vh',
      background: theme.background,
      color: theme.textPrimary,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      boxShadow: theme.shadow,
      zIndex: 1000,
      borderRight: theme.border
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 1rem',
        borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <span style={{ 
            fontSize: '2rem',
            animation: 'bounce 2s infinite'
          }}>🐝</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: '#f59e0b',
              margin: 0
            }}>
              SmartBee
            </h2>
            <p style={{ 
              fontSize: '0.75rem', 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              margin: 0
            }}>
              {roleConfig.name}
            </p>
          </div>
        </div>

        {/* User Info */}
        <div style={{
          padding: '1rem',
          background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          border: theme.border
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            border: '2px solid rgba(245, 158, 11, 0.3)'
          }}>
            👤
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: theme.textPrimary,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currentUser?.nombre} {currentUser?.apellido}
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: '#f59e0b',
              fontWeight: '500',
              margin: 0
            }}>
              {roleConfig.name}
            </p>
            {currentUser?.comuna && (
              <p style={{
                fontSize: '0.75rem',
                color: theme.textMuted,
                margin: 0
              }}>
                📍 {currentUser.comuna}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div style={{ padding: '1rem' }}>
        <div style={{ 
          padding: '0.75rem', 
          borderRadius: '0.5rem',
          backgroundColor: isConnected 
            ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5')
            : (isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2'),
          border: `1px solid ${isConnected 
            ? (isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0')
            : (isDarkMode ? 'rgba(220, 38, 38, 0.3)' : '#fecaca')}`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: isConnected ? '#10b981' : '#dc2626',
              boxShadow: `0 0 6px ${isConnected ? 'rgba(16, 185, 129, 0.6)' : 'rgba(220, 38, 38, 0.6)'}`
            }} />
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: isConnected 
                ? (isDarkMode ? '#6ee7b7' : '#065f46')
                : (isDarkMode ? '#fca5a5' : '#991b1b')
            }}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.5rem 0'
      }}>
        <div style={{
          padding: '0.5rem 1rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: theme.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.25rem'
        }}>
          {isAdmin ? 'Administración' : 'Mi Panel'}
        </div>

        {menuItems.map((item) => {
          const isActive = currentPageId === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                color: isActive ? '#f59e0b' : theme.textSecondary,
                background: isActive 
                  ? 'rgba(245, 158, 11, 0.2)' 
                  : 'transparent',
                border: 'none',
                borderRight: isActive ? '3px solid #f59e0b' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  e.target.style.color = theme.textPrimary;
                  e.target.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = theme.textSecondary;
                  e.target.style.transform = 'translateX(0)';
                }
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  background: '#f59e0b'
                }} />
              )}
              
              <span style={{ 
                fontSize: '1.25rem',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {item.icon}
              </span>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  lineHeight: '1.2'
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  opacity: 0.7,
                  lineHeight: '1.2',
                  marginTop: '0.125rem'
                }}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* System Status para Apicultores */}
      {isApicultor && (
        <div style={{ padding: '0 1rem' }}>
          <div style={{
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: theme.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
          }}>
            Estado del Sistema
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0',
              fontSize: '0.75rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)'
              }} />
              <span style={{ color: theme.textSecondary }}>Sensores activos</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0',
              fontSize: '0.75rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#06d6a0',
                boxShadow: '0 0 6px rgba(6, 214, 160, 0.6)'
              }} />
              <span style={{ color: theme.textSecondary }}>Datos sincronizados</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions para Administradores */}
      {isAdmin && (
        <div style={{ 
          padding: '0 1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: theme.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
          }}>
            Acciones Rápidas
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '0.375rem',
              color: theme.textSecondary,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(245, 158, 11, 0.2)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(245, 158, 11, 0.1)';
              e.target.style.transform = 'translateY(0)';
            }}>
              <span style={{ fontSize: '0.875rem' }}>⚡</span>
              <span style={{ fontWeight: '500' }}>Nuevo Usuario</span>
            </button>
            
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '0.375rem',
              color: theme.textSecondary,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(245, 158, 11, 0.2)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(245, 158, 11, 0.1)';
              e.target.style.transform = 'translateY(0)';
            }}>
              <span style={{ fontSize: '0.875rem' }}>🔧</span>
              <span style={{ fontWeight: '500' }}>Configurar Nodo</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '1rem',
        borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        {/* Indicador de tema */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '8px',
          background: isDarkMode 
            ? 'rgba(71, 85, 105, 0.3)'
            : 'rgba(249, 250, 251, 0.8)',
          borderRadius: '8px',
          border: theme.border,
          marginBottom: '0.75rem'
        }}>
          <span>{isDarkMode ? '🌙' : '☀️'}</span>
          <span style={{ 
            fontSize: '0.75rem',
            fontWeight: '500',
            color: theme.textMuted
          }}>
            Modo {isDarkMode ? 'Oscuro' : 'Claro'}
          </span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <p style={{
            fontSize: '0.75rem',
            color: '#f59e0b',
            fontWeight: '600',
            margin: 0
          }}>
            🐝 SmartBee v2.0
          </p>
          <p style={{
            fontSize: '0.625rem',
            color: theme.textMuted,
            margin: 0
          }}>
            Sistema de Gestión Apícola
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{
              display: 'block',
              fontSize: '1rem',
              fontWeight: '700',
              color: '#f59e0b',
              lineHeight: 1
            }}>
              {isAdmin ? '⚡' : '🏠'}
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.625rem',
              color: theme.textMuted,
              marginTop: '0.125rem'
            }}>
              {isAdmin ? 'Admin' : 'Apicultor'}
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{
              display: 'block',
              fontSize: '1rem',
              fontWeight: '700',
              color: '#f59e0b',
              lineHeight: 1
            }}>
              {isConnected ? '🟢' : '🔴'}
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.625rem',
              color: theme.textMuted,
              marginTop: '0.125rem'
            }}>
              Estado
            </span>
          </div>
        </div>
      </div>

      {/* Keyframes para animación */}
      <style>{`
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
      `}</style>
    </div>
  );
};

export default Sidebar;