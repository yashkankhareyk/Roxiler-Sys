import React from 'react';

function Alert({ type, message, onClose }) {
  if (!message) return null;
  
  const getAlertStyle = () => {
    const baseStyle = {
      padding: '12px 16px',
      marginBottom: '16px',
      borderRadius: '4px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    };
    
    switch (type) {
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: '#ffebee',
          color: '#c62828',
          border: '1px solid #ef9a9a'
        };
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          border: '1px solid #a5d6a7'
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: '#fff8e1',
          color: '#f57f17',
          border: '1px solid #ffe082'
        };
      case 'info':
      default:
        return {
          ...baseStyle,
          backgroundColor: '#e3f2fd',
          color: '#0d47a1',
          border: '1px solid #90caf9'
        };
    }
  };
  
  return (
    <div style={getAlertStyle()}>
      <div>{message}</div>
      {onClose && (
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default Alert;