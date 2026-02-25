import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Hero from './components/Hero';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import GoldItems from './components/GoldItems';
import Loans from './components/Loans';
import Sidebar from './components/Sidebar';
import AdminManagement from './components/AdminManagement';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <Router>
      <div className="App">
        {!token ? (
          <Routes>
            <Route path="/" element={<Hero />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        ) : (
          <div className="dashboard-layout">
            <Sidebar onLogout={handleLogout} />
            <div className="main-content">
              <Routes>
                <Route path="/dashboard" element={<Dashboard token={token} />} />
                <Route path="/customers" element={<CustomerList token={token} />} />
                <Route path="/gold-items" element={<GoldItems token={token} />} />
                <Route path="/loans" element={<Loans token={token} />} />
                <Route path="/admin-management" element={<AdminManagement token={token} />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;