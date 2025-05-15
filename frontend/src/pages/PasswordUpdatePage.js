import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function PasswordUpdatePage() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    // Check length
    if (password.length < 8 || password.length > 16) {
      return 'Password must be between 8 and 16 characters';
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    // Check for special character
    if (!/[!@#$&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$&*)';
    }
    
    return null; // No error
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validate form inputs
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    // Check if new password and confirm password match
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirm password do not match');
      setIsLoading(false);
      return;
    }

    // Validate new password
    const passwordError = validatePassword(form.newPassword);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      // Clear form and show success message
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccess('Password updated successfully');
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Update Password</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '1rem' }}>{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="currentPassword">Current Password:</label>
          <input
            id="currentPassword"
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            required
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="newPassword">
            New Password:
            <span style={{ color: 'gray', fontSize: '0.8em', marginLeft: '0.5rem' }}>
              (8-16 chars, 1 uppercase, 1 special char)
            </span>
          </label>
          <input
            id="newPassword"
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            required
            minLength="8"
            maxLength="16"
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            padding: '0.5rem 1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default PasswordUpdatePage;