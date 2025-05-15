import React from 'react';

function Pagination({ currentPage, totalPages, onPageChange }) {
  // Generate page numbers array
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Calculate range of pages to show (show 5 pages at a time)
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return pageNumbers;
    }
    
    if (currentPage <= 3) {
      return pageNumbers.slice(0, 5);
    }
    
    if (currentPage >= totalPages - 2) {
      return pageNumbers.slice(totalPages - 5);
    }
    
    return pageNumbers.slice(currentPage - 3, currentPage + 2);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="pagination">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-button"
      >
        &laquo; Previous
      </button>
      
      {currentPage > 3 && totalPages > 5 && (
        <>
          <button onClick={() => onPageChange(1)} className="pagination-button">1</button>
          {currentPage > 4 && <span className="pagination-ellipsis">...</span>}
        </>
      )}
      
      {visiblePages.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`pagination-button ${currentPage === number ? 'active' : ''}`}
        >
          {number}
        </button>
      ))}
      
      {currentPage < totalPages - 2 && totalPages > 5 && (
        <>
          {currentPage < totalPages - 3 && <span className="pagination-ellipsis">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="pagination-button">
            {totalPages}
          </button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-button"
      >
        Next &raquo;
      </button>
      
      <style jsx>{`
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
          gap: 5px;
        }
        
        .pagination-button {
          padding: 8px 12px;
          border: 1px solid #ddd;
          background-color: white;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .pagination-button:hover:not(:disabled) {
          background-color: #f0f0f0;
        }
        
        .pagination-button.active {
          background-color: #2196F3;
          color: white;
          border-color: #2196F3;
        }
        
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pagination-ellipsis {
          margin: 0 5px;
        }
      `}</style>
    </div>
  );
}

export default Pagination;