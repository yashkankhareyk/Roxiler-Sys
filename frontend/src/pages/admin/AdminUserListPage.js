import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminUserListPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  
  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Sorting states
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch users with current filter and sort parameters
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (nameFilter) params.append('name', nameFilter);
      if (emailFilter) params.append('email', emailFilter);
      if (addressFilter) params.append('address', addressFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (sortField) {
        params.append('sortBy', sortField);
        params.append('sortOrder', sortOrder);
      }
      
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Fetch when filter or sort parameters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500); // Debounce search
    
    return () => clearTimeout(timer);
  }, [nameFilter, emailFilter, addressFilter, roleFilter, sortField, sortOrder, fetchUsers]);
  
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
  
  // Handle user row click to view details
  const handleUserClick = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>User Management</h2>
        <button 
          onClick={() => setShowAddUserModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add New User
        </button>
      </div>
      
      {/* Filter Form */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3 style={{ marginTop: 0 }}>Filter Users</h3>
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
          
          <div>
            <label htmlFor="roleFilter">Role: </label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="normal_user">Normal User</option>
              <option value="store_owner">Store Owner</option>
              <option value="system_administrator">System Administrator</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Error Messages */}
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
      
      {/* Loading Indicator */}
      {loading && <div>Loading users...</div>}
      
      {/* Users Table */}
      {!loading && users.length === 0 && (
        <div>No users found. Try adjusting your filter criteria.</div>
      )}
      
      {!loading && users.length > 0 && (
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
                  onClick={() => handleSort('role')}
                >
                  Role{renderSortIndicator('role')}
                </th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr 
                  key={user.id} 
                  style={{ 
                    borderBottom: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleUserClick(user.id)}
                >
                  <td style={{ padding: '10px' }}>{user.name}</td>
                  <td style={{ padding: '10px' }}>{user.email}</td>
                  <td style={{ padding: '10px' }}>{user.address || 'N/A'}</td>
                  <td style={{ padding: '10px' }}>
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
                      {user.role === 'system_administrator' ? 'Admin' : 
                       user.role === 'store_owner' ? 'Store Owner' : 'Normal User'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click
                        handleUserClick(user.id);
                      }}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onUserAdded={() => {
            setShowAddUserModal(false);
            fetchUsers();
          }}
          token={token}
        />
      )}
    </div>
  );
}

// Add User Modal Component
function AddUserModal({ onClose, onUserAdded, token }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'normal_user'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      setError('Name, email, password, and role are required.');
      return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    
    if (form.name.length < 20 || form.name.length > 60) {
      setError('Name must be between 20 and 60 characters.');
      return false;
    }
    
    if (form.password.length < 8 || form.password.length > 16) {
      setError('Password must be 8-16 characters.');
      return false;
    }
    
    if (!/[A-Z]/.test(form.password) || !/[!@#$&*]/.test(form.password)) {
      setError('Password must contain at least one uppercase letter and one special character (!@#$&*).');
      return false;
    }
    
    if (form.address && form.address.length > 400) {
      setError('Address cannot exceed 400 characters.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }
      
      onUserAdded();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Add New User</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            &times;
          </button>
        </div>
        
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>
              Name: <span style={{ color: 'gray', fontSize: '0.8em' }}>(20-60 characters)</span>
            </label>
            <input 
              id="name"
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '8px' }}
              required 
              minLength="20"
              maxLength="60"
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
              style={{ width: '100%', padding: '8px' }}
              required 
              pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
              title="Please enter a valid email address"
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
              Password: <span style={{ color: 'gray', fontSize: '0.8em' }}>(8-16 chars, 1 uppercase, 1 special char)</span>
            </label>
            <input 
              id="password"
              name="password" 
              type="password" 
              value={form.password} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '8px' }}
              required 
              minLength="8"
              maxLength="16"
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="address" style={{ display: 'block', marginBottom: '5px' }}>
              Address: <span style={{ color: 'gray', fontSize: '0.8em' }}>(optional, max 400 characters)</span>
            </label>
            <textarea 
              id="address"
              name="address" 
              value={form.address} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '8px', minHeight: '80px' }}
              maxLength="400"
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="role" style={{ display: 'block', marginBottom: '5px' }}>
              Role:
            </label>
            <select 
              id="role"
              name="role" 
              value={form.role} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '8px' }}
              required
            >
              <option value="normal_user">Normal User</option>
              <option value="store_owner">Store Owner</option>
              <option value="system_administrator">System Administrator</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminUserListPage;