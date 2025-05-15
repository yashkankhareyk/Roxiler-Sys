import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Call the API to logout (optional)
    fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(() => logout())
    .catch(err => {
      console.error('Logout error:', err);
      logout(); // Still logout on client side even if API call fails
    });
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🏪</span>
          <span className="logo-text">Store Ratings</span>
        </Link>
        
        <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
          <div className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        
        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {isAuthenticated ? (
            <>
              <div className="navbar-user">
                <span className="user-greeting">Hello, {user?.name?.split(' ')[0]}</span>
                
                {user?.role === 'system_administrator' && (
                  <div className="navbar-links">
                    <Link to="/admin/dashboard" className="navbar-link">Dashboard</Link>
                    <Link to="/admin/users" className="navbar-link">Users</Link>
                    <Link to="/admin/stores" className="navbar-link">Stores</Link>
                    <Link to="/update-password" className="navbar-link">Password</Link>
                  </div>
                )}
                
                {user?.role === 'store_owner' && (
                  <div className="navbar-links">
                    <Link to="/store-owner/dashboard" className="navbar-link">My Stores</Link>
                    <Link to="/update-password" className="navbar-link">Password</Link>
                  </div>
                )}
                
                {user?.role === 'normal_user' && (
                  <div className="navbar-links">
                    <Link to="/stores" className="navbar-link">Stores</Link>
                    <Link to="/profile" className="navbar-link">Profile</Link>
                    <Link to="/update-password" className="navbar-link">Password</Link>
                  </div>
                )}
                
                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="navbar-links">
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/signup" className="navbar-link signup">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .navbar {
          background-color: var(--primary-color);
          color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        
        .navbar-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .navbar-logo {
          display: flex;
          align-items: center;
          color: white;
          text-decoration: none;
          font-weight: bold;
          font-size: 1.25rem;
        }
        
        .logo-icon {
          font-size: 1.5rem;
          margin-right: 0.5rem;
        }
        
        .navbar-menu {
          display: flex;
          align-items: center;
        }
        
        .navbar-user {
          display: flex;
          align-items: center;
        }
        
        .user-greeting {
          margin-right: 1.5rem;
          font-weight: 500;
        }
        
        .navbar-links {
          display: flex;
          align-items: center;
        }
        
        .navbar-link {
          color: white;
          text-decoration: none;
          padding: 0.5rem 0.75rem;
          margin: 0 0.25rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .navbar-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .navbar-link.signup {
          background-color: var(--secondary-color);
          padding: 0.5rem 1rem;
        }
        
        .navbar-link.signup:hover {
          background-color: #e91e63;
        }
        
        .logout-button {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          margin-left: 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .logout-button:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        .mobile-menu-icon {
          display: none;
          cursor: pointer;
        }
        
        .hamburger {
          width: 24px;
          height: 20px;
          position: relative;
        }
        
        .hamburger span {
          display: block;
          position: absolute;
          height: 2px;
          width: 100%;
          background: white;
          border-radius: 2px;
          opacity: 1;
          left: 0;
          transform: rotate(0deg);
          transition: .25s ease-in-out;
        }
        
        .hamburger span:nth-child(1) {
          top: 0px;
        }
        
        .hamburger span:nth-child(2) {
          top: 9px;
        }
        
        .hamburger span:nth-child(3) {
          top: 18px;
        }
        
        .hamburger.active span:nth-child(1) {
          top: 9px;
          transform: rotate(135deg);
        }
        
        .hamburger.active span:nth-child(2) {
          opacity: 0;
          left: -60px;
        }
        
        .hamburger.active span:nth-child(3) {
          top: 9px;
          transform: rotate(-135deg);
        }
        
        @media (max-width: 768px) {
          .mobile-menu-icon {
            display: block;
          }
          
          .navbar-menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: var(--primary-color);
            flex-direction: column;
            align-items: flex-start;
            padding: 1rem;
            display: none;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          
          .navbar-menu.active {
            display: block;
          }
          
          .navbar-user {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }
          
          .user-greeting {
            margin-right: 0;
            margin-bottom: 1rem;
          }
          
          .navbar-links {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }
          
          .navbar-link {
            padding: 0.75rem 0;
            margin: 0;
            width: 100%;
          }
          
          .logout-button {
            margin: 1rem 0 0 0;
            width: 100%;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;