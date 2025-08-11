import React, { useEffect, useRef } from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = ''
}) => {
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  const sizeClasses = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '800px' },
    xl: { maxWidth: '1200px' },
    full: { maxWidth: '95vw', maxHeight: '95vh' }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Focus en el primer elemento focuseable
      setTimeout(() => {
        if (firstFocusableRef.current) {
          firstFocusableRef.current.focus();
        } else if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && closeOnEscape) {
        onClose();
      }
    };

    const handleTab = (e) => {
      if (!isOpen || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div 
        ref={modalRef}
        className={className}
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          ...sizeClasses[size],
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div style={{
            padding: '1.5rem 1.5rem 1rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            {title && (
              <h3 
                id="modal-title"
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}
              >
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                ref={!title ? firstFocusableRef : null}
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: '#6b7280',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  lineHeight: '1',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6b7280';
                }}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{
          padding: '1.5rem',
          flex: 1,
          overflow: 'auto'
        }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-50px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// Componente para confirmación
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmar acción',
  message = '¿Estás seguro de que deseas continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn btn-danger';
      case 'info':
        return 'btn btn-primary';
      default:
        return 'btn btn-warning';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          fontSize: '3rem', 
          marginBottom: '1rem' 
        }}>
          {getIcon()}
        </div>
        
        <p style={{ 
          marginBottom: '2rem',
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          {message}
        </p>
        
        <div className="flex flex-gap flex-center">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ minWidth: '100px' }}
          >
            {cancelText}
          </button>
          <button
            className={getConfirmButtonClass()}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{ minWidth: '100px' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;