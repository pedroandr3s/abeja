import React from 'react';

const Card = ({ 
  title, 
  children, 
  className = '', 
  headerActions,
  padding = 'default',
  shadow = true 
}) => {
  const getPaddingClass = () => {
    switch (padding) {
      case 'none':
        return '0';
      case 'small':
        return '1rem';
      case 'large':
        return '2rem';
      default:
        return '1.5rem';
    }
  };

  const cardStyles = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: shadow ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
    border: shadow ? 'none' : '1px solid #e5e7eb',
    overflow: 'hidden'
  };

  return (
    <div 
      className={className}
      style={cardStyles}
    >
      {title && (
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            {title}
          </h3>
          {headerActions && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {headerActions}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: getPaddingClass() }}>
        {children}
      </div>
    </div>
  );
};

export default Card;