import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function StoreListPage() {
  const { token } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  
  // Search states
  const [nameSearch, setNameSearch] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  
  // Sorting states
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch stores with current search and sort parameters
  const fetchStores = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (nameSearch) params.append('name', nameSearch);
      if (addressSearch) params.append('address', addressSearch);
      if (sortField) {
        params.append('sortBy', sortField);
        params.append('sortOrder', sortOrder);
      }
      
      const response = await fetch(`/api/stores?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }
      
      const data = await response.json();
      setStores(data.stores);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Failed to load stores. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchStores();
  }, []);
  
  // Fetch when search or sort parameters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStores();
    }, 500); // Debounce search
    
    return () => clearTimeout(timer);
  }, [nameSearch, addressSearch, sortField, sortOrder]);
  
  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  // Handle rating submission
  const submitRating = async (storeId, ratingValue) => {
    // Validate rating value
    if (ratingValue < 1 || ratingValue > 5 || !Number.isInteger(ratingValue)) {
      setRatingError('Rating must be a whole number between 1 and 5');
      return;
    }
    
    setSubmittingRating(true);
    setRatingError('');
    
    try {
      const response = await fetch(`/api/stores/${storeId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating_value: ratingValue })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit rating');
      }
      
      const data = await response.json();
      
      // Update the store in the local state with new rating data
      setStores(prevStores => 
        prevStores.map(store => 
          store.id === storeId 
            ? { 
                ...store, 
                average_rating: data.store.average_rating,
                rating_count: data.store.rating_count,
                user_rating: ratingValue
              } 
            : store
        )
      );
      
    } catch (err) {
      console.error('Error submitting rating:', err);
      setRatingError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Render star rating selector
  const RatingSelector = ({ storeId, currentRating }) => {
    const [selectedRating, setSelectedRating] = useState(currentRating || 0);
    const [hoveredRating, setHoveredRating] = useState(0);
    
    const handleRatingClick = (rating) => {
      setSelectedRating(rating);
      submitRating(storeId, rating);
    };
    
    return (
      <div>
        {[1, 2, 3, 4, 5].map(rating => (
          <span
            key={rating}
            style={{
              cursor: 'pointer',
              color: (hoveredRating || selectedRating) >= rating ? 'gold' : 'gray',
              fontSize: '1.5rem',
              marginRight: '5px'
            }}
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => handleRatingClick(rating)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2>Store Listings</h2>
      
      {/* Search Form */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label htmlFor="nameSearch">Store Name: </label>
            <input
              id="nameSearch"
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Search by name..."
            />
          </div>
          
          <div>
            <label htmlFor="addressSearch">Address: </label>
            <input
              id="addressSearch"
              type="text"
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              placeholder="Search by address..."
            />
          </div>
        </div>
      </div>
      
      {/* Error Messages */}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {ratingError && <div style={{ color: 'red' }}>{ratingError}</div>}
      
      {/* Loading Indicator */}
      {loading && <div>Loading stores...</div>}
      
      {/* Stores Table */}
      {!loading && stores.length === 0 && (
        <div>No stores found. Try adjusting your search criteria.</div>
      )}
      
      {!loading && stores.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th 
                style={{ cursor: 'pointer', padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}
                onClick={() => handleSort('name')}
              >
                Store Name{renderSortIndicator('name')}
              </th>
              <th 
                style={{ cursor: 'pointer', padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}
                onClick={() => handleSort('address')}
              >
                Address{renderSortIndicator('address')}
              </th>
              <th 
                style={{ cursor: 'pointer', padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}
                onClick={() => handleSort('average_rating')}
              >
                Overall Rating{renderSortIndicator('average_rating')}
              </th>
              <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                Your Rating
              </th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{store.name}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{store.address}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                  {store.average_rating ? (
                    <div>
                      {store.average_rating.toFixed(1)} ★ ({store.rating_count} {store.rating_count === 1 ? 'rating' : 'ratings'})
                    </div>
                  ) : (
                    'No ratings yet'
                  )}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                  {submittingRating ? (
                    <div>Submitting...</div>
                  ) : (
                    <div>
                      {store.user_rating && (
                        <div style={{ marginBottom: '5px' }}>
                          Your rating: {store.user_rating} ★
                        </div>
                      )}
                      <RatingSelector 
                        storeId={store.id} 
                        currentRating={store.user_rating} 
                      />
                      <div style={{ fontSize: '0.8rem', color: 'gray', marginTop: '5px' }}>
                        {store.user_rating ? 'Click to modify your rating' : 'Click to rate this store'}
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StoreListPage;