import React, { useState, useEffect } from 'react';

const Alert = ({ 
  type = 'info', 
  message, 
  title,
  onClose, 
  autoClose = false,
  autoCloseDelay = 5000,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(() => onClose(), 150); // Delay para animación
    }
  };

  const getAlertStyles = () => {
    const baseStyles = {
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid',
      marginBottom: '1rem',
      position: 'relative',
      transition: 'all 0.3s ease',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(-10px)'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#d1fae5',
          borderColor: '#a7f3d0',
          color: '#065f46'
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: '#fee2e2',
          borderColor: '#fecaca',
          color: '#991b1b'
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#fef3c7',
          borderColor: '#fde68a',
          color: '#92400e'
        };
      default: // info
        return {
          ...baseStyles,
          backgroundColor: '#dbeafe',
          borderColor: '#bfdbfe',
          color: '#1e40af'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getBorderLeftColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  if (!isVisible && !onClose) return null;

  return (
    <div 
      className={className}
      style={{
        ...getAlertStyles(),
        borderLeft: `4px solid ${getBorderLeftColor()}`
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '0.75rem' 
      }}>
        <span style={{ 
          fontSize: '1.25rem', 
          flexShrink: 0,
          lineHeight: '1'
        }}>
          {getIcon()}
        </span>
        
        <div style={{ flex: 1 }}>
          {title && (
            <h4 style={{ 
              fontWeight: '600', 
              marginBottom: '0.5rem',
              fontSize: '1rem',
              margin: '0 0 0.25rem 0'
            }}>
              {title}
            </h4>
          )}
          <div style={{ 
            fontSize: '0.875rem', 
            lineHeight: '1.5',
            margin: 0
          }}>
            {typeof message === 'string' ? (
              <p style={{ margin: 0 }}>{message}</p>
            ) : (
              message
            )}
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              lineHeight: '1',
              color: 'inherit',
              opacity: 0.7,
              padding: '0.25rem',
              borderRadius: '0.25rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = 1;
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = 0.7;
              e.target.style.backgroundColor = 'transparent';
            }}
            aria-label="Cerrar alerta"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Barra de progreso para auto-close */}
      {autoClose && autoCloseDelay > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          backgroundColor: getBorderLeftColor(),
          animation: `shrink ${autoCloseDelay}ms linear`,
          borderRadius: '0 0 0.5rem 0.5rem'
        }} />
      )}
      
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Componente para mostrar múltiples alertas
export const AlertContainer = ({ alerts = [], onRemove }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 9999,
      maxWidth: '400px',
      width: '100%'
    }}>
      {alerts.map((alert, index) => (
        <Alert
          key={alert.id || index}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => onRemove && onRemove(index)}
          autoClose={alert.autoClose}
          autoCloseDelay={alert.autoCloseDelay}
        />
      ))}
    </div>
  );
};

export default Alert;