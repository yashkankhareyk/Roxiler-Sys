import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import SkeletonLoader from '../../components/SkeletonLoader';
import { get } from '../../services/api';
import { toast } from 'react-toastify';

function StoreOwnerDashboard() {
  const { token } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOwnerStores = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await get('/api/store-owner/stores');
        setStores(data.stores || []);
      } catch (err) {
        console.error('Error fetching stores:', err);
        setError('Failed to load your stores. Please try again later.');
        toast.error('Failed to load your stores. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOwnerStores();
  }, [token]);

  // Render loading skeleton
  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>My Stores</h2>
        </div>
        <div className="card-body">
          <SkeletonLoader type="text" count={1} height="30px" width="50%" />
          <div style={{ marginTop: '20px' }}>
            <SkeletonLoader type="rectangle" count={3} height="50px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>My Stores</h2>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        
        {stores.length === 0 ? (
          <div className="alert alert-info">
            <p>You don't have any stores yet.</p>
            <p>Please contact an administrator to have stores assigned to your account.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Store Name</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Average Rating</th>
                  <th>Total Ratings</th>
                </tr>
              </thead>
              <tbody>
                {stores.map(store => (
                  <tr key={store.id}>
                    <td>{store.name}</td>
                    <td>{store.email || 'N/A'}</td>
                    <td>{store.address || 'N/A'}</td>
                    <td>
                      {store.average_rating ? (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: '5px' }}>{store.average_rating.toFixed(1)}</span>
                          <div style={{ color: 'gold' }}>★</div>
                        </div>
                      ) : (
                        'No ratings yet'
                      )}
                    </td>
                    <td>{store.rating_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreOwnerDashboard;