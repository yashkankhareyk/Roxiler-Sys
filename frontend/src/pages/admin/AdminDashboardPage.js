import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalRatings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch('/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        
        const data = await response.json();
        setStats({
          totalUsers: data.totalUsers || 0,
          totalStores: data.totalStores || 0,
          totalRatings: data.totalRatings || 0
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, [token]);

  // Card component for displaying stats
  const StatCard = ({ title, value, icon }) => (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '20px',
      textAlign: 'center',
      minWidth: '200px'
    }}>
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>{icon}</div>
      <h3 style={{ margin: '0 0 10px 0' }}>{title}</h3>
      <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{value}</p>
    </div>
  );

  return (
    <div>
      <h2>Admin Dashboard</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}
      
      {loading ? (
        <div>Loading dashboard statistics...</div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px', 
          justifyContent: 'center',
          marginTop: '20px'
        }}>
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers} 
            icon="👥" 
          />
          <StatCard 
            title="Total Stores" 
            value={stats.totalStores} 
            icon="🏪" 
          />
          <StatCard 
            title="Total Ratings" 
            value={stats.totalRatings} 
            icon="⭐" 
          />
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;