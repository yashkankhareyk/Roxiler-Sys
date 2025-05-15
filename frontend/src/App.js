import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import PasswordUpdatePage from "./pages/PasswordUpdatePage";
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUserListPage from './pages/admin/AdminUserListPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminStoreListPage from './pages/admin/AdminStoreListPage';
import StoreOwnerDashboard from './pages/store-owner/StoreOwnerDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Wrapper to inject auth logic into pages
function LoginWrapper() {
  const { login } = useAuth();
  return <LoginPage onLogin={(user) => login(user, localStorage.getItem("token"))} />;
}

function SignupWrapper() {
  const { login } = useAuth();
  return <SignupPage onSignup={(user) => login(user, localStorage.getItem("token"))} />;
}

// Placeholder components for different dashboards
const StorePage = () => <div>Stores Page</div>;
const ProfilePage = () => <div>User Profile Page</div>;
// Remove the duplicate declaration of StoreOwnerDashboard
// const StoreOwnerDashboard = () => <div>Store Owner Dashboard</div>; -- Remove this line

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div style={{ padding: '1rem' }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginWrapper />} />
            <Route path="/signup" element={<SignupWrapper />} />
            
            {/* Protected routes for normal users */}
            <Route 
              path="/stores" 
              element={
                <ProtectedRoute allowedRoles={['normal_user', 'system_administrator']}>
                  <StorePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/update-password" 
              element={
                <ProtectedRoute>
                  <PasswordUpdatePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes for admin */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['system_administrator']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['system_administrator']}>
                  <AdminUserListPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/:userId" 
              element={
                <ProtectedRoute allowedRoles={['system_administrator']}>
                  <AdminUserDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/stores" 
              element={
                <ProtectedRoute allowedRoles={['system_administrator']}>
                  <AdminStoreListPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes for store owners */}
            <Route 
              path="/store-owner/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['store_owner']}>
                  <StoreOwnerDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect based on authentication status */}
            <Route 
              path="/" 
              element={
                <AuthRedirect />
              } 
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <ToastContainer position="top-right" autoClose={5000} />
      </Router>
    </AuthProvider>
  );
}

// Component to redirect based on auth status and role
function AuthRedirect() {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Redirect based on user role
  switch (user.role) {
    case 'system_administrator':
      return <Navigate to="/admin/dashboard" />;
    case 'store_owner':
      return <Navigate to="/store-owner/dashboard" />;
    case 'normal_user':
      return <Navigate to="/stores" />;
    default:
      return <Navigate to="/login" />;
  }
}

export default App;