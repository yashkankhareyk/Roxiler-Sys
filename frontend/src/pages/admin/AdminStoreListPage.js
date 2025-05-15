import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function AdminStoreListPage() {
  const { token } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  
  // Sorting states
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Add store modal state
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  
  // Fetch stores with current filter and sort parameters
  // Memoize the fetchStores function with useCallback
  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (nameFilter) params.append('name', nameFilter);
      if (emailFilter) params.append('email', emailFilter);
      if (addressFilter) params.append('address', addressFilter);
      if (sortField) {
        params.append('sortBy', sortField);
        params.append('sortOrder', sortOrder);
      }
      
      const response = await fetch(`/api/admin/stores?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }
      
      const data = await response.json();
      setStores(data.stores || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Failed to load stores. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [nameFilter, emailFilter, addressFilter, sortField, sortOrder, token]);
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);
  
  // Fetch when search or sort parameters change - no longer needed as fetchStores will update when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStores();
    }, 500); // Debounce search
    
    return () => clearTimeout(timer);
  }, [fetchStores]);
  
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Store Management</h2>
        <button 
          onClick={() => setShowAddStoreModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add New Store
        </button>
      </div>
      
      {/* Filter Form */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3 style={{ marginTop: 0 }}>Filter Stores</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <label htmlFor="nameFilter">Name: </label>
            <input
              id="nameFilter"
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Filter by name..."
            />
          </div>
          
          <div>
            <label htmlFor="emailFilter">Email: </label>
            <input
              id="emailFilter"
              type="text"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Filter by email..."
            />
          </div>
          
          <div>
            <label htmlFor="addressFilter">Address: </label>
            <input
              id="addressFilter"
              type="text"
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
              placeholder="Filter by address..."
            />
          </div>
        </div>
      </div>
      
      {/* Error Messages */}
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
      
      {/* Loading Indicator */}
      {loading && <div>Loading stores...</div>}
      
      {/* Stores Table */}
      {!loading && stores.length === 0 && (
        <div>No stores found. Try adjusting your filter criteria.</div>
      )}
      
      {!loading && stores.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th 
                  style={{ cursor: 'pointer', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}
                  onClick={() => handleSort('name')}
                >
                  Name{renderSortIndicator('name')}
                </th>
                <th 
                  style={{ cursor: 'pointer', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}
                  onClick={() => handleSort('email')}
                >
                  Email{renderSortIndicator('email')}
                </th>
                <th 
                  style={{ cursor: 'pointer', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}
                  onClick={() => handleSort('address')}
                >
                  Address{renderSortIndicator('address')}
                </th>
                <th 
                  style={{ cursor: 'pointer', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}
                  onClick={() => handleSort('average_rating')}
                >
                  Rating{renderSortIndicator('average_rating')}
                </th>
              </tr>
            </thead>
            <tbody>
              {stores.map(store => (
                <tr 
                  key={store.id}
                  style={{ 
                    borderBottom: '1px solid #ddd',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={{ padding: '10px' }}>{store.name}</td>
                  <td style={{ padding: '10px' }}>{store.email || 'N/A'}</td>
                  <td style={{ padding: '10px' }}>{store.address || 'N/A'}</td>
                  <td style={{ padding: '10px' }}>
                    {store.average_rating ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: '5px' }}>
                            {store.average_rating.toFixed(1)}
                          </span>
                          <div style={{ color: 'gold' }}>★</div>
                        </div>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                          ({store.rating_count} ratings)
                        </div>
                      </div>
                    ) : (
                      'No ratings yet'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Add Store Modal */}
      {showAddStoreModal && (
        <AddStoreModal 
          onClose={() => setShowAddStoreModal(false)} 
          onStoreAdded={() => {
            setShowAddStoreModal(false);
            fetchStores();
          }}
          token={token}
        />
      )}
    </div>
  );
}

// Add Store Modal Component
function AddStoreModal({ onClose, onStoreAdded, token }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    // Basic validation
    if (!form.name) {
      setError('Store name is required');
      setIsSubmitting(false);
      return;
    }
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create store');
      }
      
      // Success - notify parent and close modal
      onStoreAdded();
    } catch (err) {
      console.error('Error creating store:', err);
      setError(err.message || 'Failed to create store. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Modal backdrop style
  const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };
  
  // Modal content style
  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative'
  };
  
  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h2>Add New Store</h2>
        
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>
              Store Name: <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
              Email:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="address" style={{ display: 'block', marginBottom: '5px' }}>
              Address:
            </label>
            <textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '100px' }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f0f0f0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminStoreListPage;