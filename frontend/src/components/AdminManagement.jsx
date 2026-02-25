import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminManagement.css';
import { FaPlus, FaTrash, FaEnvelope, FaUserCog } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:8080/api/admin-management';

const AdminManagement = ({ token }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      await axios.post(`${API_BASE_URL}/admins/add?email=${encodeURIComponent(newEmail)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewEmail('');
      fetchAdmins();
      setMessage({ type: 'success', text: 'Admin added successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add admin' });
    }
  };

  const handleRemoveAdmin = async (email) => {
    if (window.confirm(`Are you sure you want to remove ${email} from admin list?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/admins/remove?email=${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchAdmins();
        setMessage({ type: 'success', text: 'Admin removed successfully' });
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to remove admin' });
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-management fade-in">
      <h1>Admin Management</h1>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      <div className="admin-card">
        <h2>Add New Admin</h2>
        <form onSubmit={handleAddAdmin} className="add-admin-form">
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Enter admin email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="add-button">
            <FaPlus /> Add Admin
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h2>Admin List</h2>
        <div className="admin-list">
          {admins.length > 0 ? (
            admins.map(email => (
              <div key={email} className="admin-item">
                <div className="admin-info">
                  <FaUserCog className="admin-icon" />
                  <span>{email}</span>
                </div>
                <button 
                  className="delete-btn" 
                  onClick={() => handleRemoveAdmin(email)}
                  title="Remove Admin"
                >
                  <FaTrash />
                </button>
              </div>
            ))
          ) : (
            <p className="no-data">No admins found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;