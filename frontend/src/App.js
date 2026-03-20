import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Hero from './components/Hero';
import Login from './components/Login';
import SignUp from './components/SignUp';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import AdminSidebar from './components/AdminSidebar';
import UserSidebar from './components/UserSidebar';
import CustomerList from './components/CustomerList';
import GoldItems from './components/GoldItems';
import Loans from './components/Loans';
import AdminManagement from './components/AdminManagement';
import UserProfile from './components/UserProfile';
import UserLoans from './components/UserLoans';
import UserGoldItems from './components/UserGoldItems';
import LoanRequest from './components/LoanRequest';
import LanguageSwitcher from './components/LanguageSwitcher';
import StaffDashboard from './components/StaffDashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  const handleLogin = (newToken, role) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userRole', role);
    setToken(newToken);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setToken(null);
    setUserRole(null);
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!token) {
      return <Navigate to="/login" />;
    }
    
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      if (userRole === 'ADMIN') {
        return <Navigate to="/admin/dashboard" />;
      } else if (userRole === 'STAFF') {
        return <Navigate to="/staff/dashboard" />;
      } else {
        return <Navigate to="/user/dashboard" />;
      }
    }
    
    return children;
  };

  const AdminLayout = ({ children }) => (
    <div className="dashboard-layout">
      <AdminSidebar onLogout={handleLogout} />
      <div className="main-content">
        <LanguageSwitcher />
        {children}
      </div>
    </div>
  );

  const UserLayout = ({ children }) => (
    <div className="dashboard-layout">
      <UserSidebar onLogout={handleLogout} />
      <div className="main-content">
        <LanguageSwitcher />
        {children}
      </div>
    </div>
  );

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <>
              <LanguageSwitcher />
              <Hero />
            </>
          } />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard token={token} />} />
                  <Route path="customers" element={<CustomerList token={token} />} />
                  <Route path="gold-items" element={<GoldItems token={token} />} />
                  <Route path="loans" element={<Loans token={token} />} />
                  <Route path="management" element={<AdminManagement token={token} />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/user/*" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'USER']}>
              <UserLayout>
                <Routes>
                  <Route path="dashboard" element={<UserDashboard token={token} />} />
                  <Route path="profile" element={<UserProfile token={token} />} />
                  <Route path="my-loans" element={<UserLoans token={token} />} />
                  <Route path="my-gold-items" element={<UserGoldItems token={token} />} />
                  <Route path="request-loan" element={<LoanRequest token={token} />} />
                  <Route path="*" element={<Navigate to="/user/dashboard" />} />
                </Routes>
              </UserLayout>
            </ProtectedRoute>
          } />

          <Route path="/staff/*" element={
            <ProtectedRoute allowedRoles={['STAFF']}>
              <UserLayout>
                <Routes>
                  <Route path="dashboard" element={<StaffDashboard />} />
                  <Route path="customers" element={<CustomerList token={token} />} />
                  <Route path="pending-loans" element={<Loans token={token} />} />
                  <Route path="*" element={<Navigate to="/staff/dashboard" />} />
                </Routes>
              </UserLayout>
            </ProtectedRoute>
          } />

          <Route path="/" element={
            token ? (
              userRole === 'ADMIN' ? 
                <Navigate to="/admin/dashboard" /> : 
                (userRole === 'STAFF' ? 
                  <Navigate to="/staff/dashboard" /> : 
                  <Navigate to="/user/dashboard" />
                )
            ) : (
              <Navigate to="/" />
            )
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;