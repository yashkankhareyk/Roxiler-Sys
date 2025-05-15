import React from 'react';

function LoadingSpinner({ size = 'medium', text = 'Loading...' }) {
  // Size variants
  const sizeMap = {
    small: { width: '20px', height: '20px', border: '3px solid' },
    medium: { width: '40px', height: '40px', border: '4px solid' },
    large: { width: '60px', height: '60px', border: '5px solid' }
  };
  
  const spinnerSize = sizeMap[size] || sizeMap.medium;
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        ...spinnerSize,
        borderRadius: '50%',
        borderColor: '#f3f3f3',
        borderTopColor: '#3498db',
        animation: 'spin 1s linear infinite',
        marginBottom: text ? '10px' : 0
      }} />
      
      {text && <div>{text}</div>}
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default LoadingSpinner;