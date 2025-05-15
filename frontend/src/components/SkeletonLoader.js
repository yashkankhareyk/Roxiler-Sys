import React from 'react';

function SkeletonLoader({ type = 'text', count = 1, width, height }) {
  // Generate skeleton items based on count
  const items = Array(count).fill(0);
  
  // Style based on type
  const getStyle = () => {
    const baseStyle = {
      backgroundColor: '#e0e0e0',
      borderRadius: '4px',
      animation: 'pulse 1.5s ease-in-out infinite',
      margin: '5px 0'
    };
    
    switch (type) {
      case 'text':
        return {
          ...baseStyle,
          height: height || '16px',
          width: width || '100%'
        };
      case 'circle':
        return {
          ...baseStyle,
          height: height || '50px',
          width: width || '50px',
          borderRadius: '50%'
        };
      case 'rectangle':
        return {
          ...baseStyle,
          height: height || '100px',
          width: width || '100%'
        };
      default:
        return baseStyle;
    }
  };
  
  return (
    <div>
      {items.map((_, index) => (
        <div key={index} style={getStyle()} />
      ))}
      
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>
    </div>
  );
}

export default SkeletonLoader;