import React, { useState } from "react";
import { Link } from "react-router-dom";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Improved validation
    if (!email || !password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Invalid email or password. Please try again.");
        } else {
          localStorage.setItem("token", data.token);
          onLogin && onLogin(data.user);
        }
      } else {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        setError("Server error. Please check if the backend server is running.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check if the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>
        
        {error && (
          <div className="login-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input 
                id="email"
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)} 
                required 
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                title="Please enter a valid email address"
                placeholder="your@email.com"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input 
                id="password"
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Signing in...</span>
              </>
            ) : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
        </div>
      </div>
      
      <style jsx>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 70px);
          padding: 2rem;
        }
        
        .login-card {
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          width: 100%;
          max-width: 450px;
          padding: 2.5rem;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .login-header h2 {
          color: var(--primary-color);
          margin-bottom: 0.5rem;
          font-size: 1.75rem;
        }
        
        .login-header p {
          color: var(--light-text);
          margin-bottom: 0;
        }
        
        .login-error {
          display: flex;
          align-items: center;
          background-color: #ffebee;
          color: #c62828;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }
        
        .login-error svg {
          margin-right: 0.5rem;
          flex-shrink: 0;
        }
        
        .login-form {
          margin-bottom: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1.25rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-color);
        }
        
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .input-wrapper svg {
          position: absolute;
          left: 12px;
          color: #9e9e9e;
        }
        
        .input-wrapper input {
          width: 100%;
          padding: 0.75rem 0.75rem 0.75rem 40px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 1rem;
          transition: all 0.2s;
        }
        
        .input-wrapper input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px var(--primary-light);
          outline: none;
        }
        
        .login-button {
          width: 100%;
          padding: 0.875rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .login-button:hover:not(:disabled) {
          background-color: var(--primary-dark);
        }
        
        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .login-button.loading {
          background-color: var(--primary-dark);
        }
        
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
          margin-right: 0.5rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .login-footer {
          text-align: center;
          color: var(--light-text);
        }
        
        .login-footer a {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
        }
        
        .login-footer a:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 480px) {
          .login-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;