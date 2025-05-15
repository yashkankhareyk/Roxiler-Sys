import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function AdminUserDetailPage() {
  const { userId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }
        
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [userId, token]);

  const goBack = () => {
    navigate('/admin/users');
  };

  if (loading) {
    return <div>Loading user details...</div>;
  }

  if (error) {
    return (
      <div>
        <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>
        <button onClick={goBack}>Back to User List</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <div>User not found</div>
        <button onClick={goBack}>Back to User List</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={goBack}
          style={{
            marginRight: '15px',
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          &larr; Back
        </button>
        <h2 style={{ margin: 0 }}>User Details</h2>
      </div>
      
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h3>Basic Information</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold', width: '120px' }}>Name:</td>
                  <td style={{ padding: '8px 0' }}>{user.name}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Email:</td>
                  <td style={{ padding: '8px 0' }}>{user.email}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Address:</td>
                  <td style={{ padding: '8px 0' }}>{user.address || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Role:</td>
                  <td style={{ padding: '8px 0' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.85em',
                      backgroundColor: 
                        user.role === 'system_administrator' ? '#ff9800' : 
                        user.role === 'store_owner' ? '#4CAF50' : '#2196F3',
                      color: 'white'
                    }}>
                      {user.role === 'system_administrator' ? 'System Administrator' : 
                       user.role === 'store_owner' ? 'Store Owner' : 'Normal User'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Created:</td>
                  <td style={{ padding: '8px 0' }}>
                    {new Date(user.created_at).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {user.role === 'store_owner' && user.stores && (
            <div style={{ flex: '1 1 300px' }}>
              <h3>Store Information</h3>
              {user.stores.length === 0 ? (
                <p>This store owner has no stores yet.</p>
              ) : (
                <>
                  <p><strong>Number of Stores:</strong> {user.stores.length}</p>
                  
                  {user.stores.map(store => (
                    <div 
                      key={store.id}
                      style={{ 
                        marginBottom: '15px',
                        padding: '10px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '4px'
                      }}
                    >
                      <p style={{ margin: '5px 0' }}><strong>Store Name:</strong> {store.name}</p>
                      <p style={{ margin: '5px 0' }}><strong>Email:</strong> {store.email || 'N/A'}</p>
                      <p style={{ margin: '5px 0' }}><strong>Address:</strong> {store.address || 'N/A'}</p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Average Rating:</strong> {store.average_rating ? 
                          `${store.average_rating.toFixed(1)} / 5.0 (${store.rating_count} ratings)` : 
                          'No ratings yet'}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUserDetailPage;