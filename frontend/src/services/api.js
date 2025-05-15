import { toast } from 'react-toastify';

// Create axios instance or use fetch with interceptors
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Handle based on status code
  if (error.status === 401) {
    // Unauthorized - redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    toast.error('Your session has expired. Please log in again.');
  } else if (error.status === 403) {
    // Forbidden
    toast.error('You do not have permission to perform this action.');
  } else if (error.status === 404) {
    // Not found
    toast.error('The requested resource was not found.');
  } else if (error.status >= 500) {
    // Server error
    toast.error('Server error. Please try again later.');
  } else {
    // Default error message
    toast.error(error.message || 'An unexpected error occurred.');
  }
  
  return Promise.reject(error);
};

// Wrapper for fetch API with error handling
export const apiRequest = async (url, options = {}) => {
  try {
    // Set default headers if token exists
    const token = localStorage.getItem('token');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    
    // Set default content type if not provided
    if (options.body && !options.headers?.['Content-Type']) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
    }
    
    const response = await fetch(url, options);
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || 'Request failed');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    
    // Parse JSON response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    return handleApiError(error);
  }
};

// Common API methods
export const get = (url) => apiRequest(url);
export const post = (url, data) => apiRequest(url, { method: 'POST', body: JSON.stringify(data) });
export const put = (url, data) => apiRequest(url, { method: 'PUT', body: JSON.stringify(data) });
export const del = (url) => apiRequest(url, { method: 'DELETE' });