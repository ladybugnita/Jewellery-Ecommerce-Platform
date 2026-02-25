import React, { useState, useEffect } from 'react';
import './CustomerList.css';
import { adminAPI } from '../services/api';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaEye } from 'react-icons/fa';

const CustomerList = ({ token }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    fullName: '',
    address: '',
    idProof: 'citizenship',
    idProofNumber: '',
    occupation: '',
    annualIncome: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await adminAPI.getCustomers();
      setCustomers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await adminAPI.updateCustomer(editingCustomer.id, formData);
      } else {
        await adminAPI.createCustomer(formData);
      }
      fetchCustomers();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save customer:', err);
      alert('Failed to save customer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await adminAPI.deleteCustomer(id);
        fetchCustomers();
      } catch (err) {
        console.error('Failed to delete customer:', err);
        alert('Failed to delete customer');
      }
    }
  };

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      username: customer.username || '',
      email: customer.email || '',
      password: '',
      phoneNumber: customer.phoneNumber || '',
      fullName: customer.fullName || '',
      address: customer.address || '',
      idProof: customer.idProof || 'citizenship',
      idProofNumber: customer.idProofNumber || '',
      occupation: customer.occupation || '',
      annualIncome: customer.annualIncome || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      fullName: '',
      address: '',
      idProof: 'citizenship',
      idProofNumber: '',
      occupation: '',
      annualIncome: ''
    });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phoneNumber?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="customer-list fade-in">
      <div className="list-header">
        <h1>Customers</h1>
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <FaPlus /> Add Customer
          </button>
        </div>
      </div>

      <div className="customers-grid">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="customer-card">
            <div className="customer-avatar">
              {customer.fullName?.charAt(0) || 'C'}
            </div>
            <div className="customer-info">
              <h3>{customer.fullName}</h3>
              <p className="customer-email">{customer.email}</p>
              <p className="customer-phone">{customer.phoneNumber}</p>
              <p className="customer-address">{customer.address}</p>
              <div className="customer-details">
                <span className="badge">{customer.occupation || 'N/A'}</span>
                <span className="badge">₹{customer.annualIncome?.toLocaleString() || 0}</span>
              </div>
            </div>
            <div className="customer-actions">
              <button className="view-btn" onClick={() => handleView(customer)}>
                <FaEye />
              </button>
              <button className="edit-btn" onClick={() => handleEdit(customer)}>
                <FaEdit />
              </button>
              <button className="delete-btn" onClick={() => handleDelete(customer.id)}>
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {!editingCustomer && (
                <div className="form-row">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingCustomer}
                  />
                </div>
              )}
              <div className="form-row">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
                <select
                  name="idProof"
                  value={formData.idProof}
                  onChange={handleInputChange}
                >
                  <option value="citizenship">Citizenship</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                </select>
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="idProofNumber"
                  placeholder="ID Proof Number"
                  value={formData.idProofNumber}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="occupation"
                  placeholder="Occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row">
                <input
                  type="number"
                  name="annualIncome"
                  placeholder="Annual Income"
                  value={formData.annualIncome}
                  onChange={handleInputChange}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedCustomer && (
        <div className="modal">
          <div className="modal-content">
            <h2>Customer Details</h2>
            <div className="customer-details-view">
              <p><strong>Full Name:</strong> {selectedCustomer.fullName}</p>
              <p><strong>Username:</strong> {selectedCustomer.username}</p>
              <p><strong>Email:</strong> {selectedCustomer.email}</p>
              <p><strong>Phone:</strong> {selectedCustomer.phoneNumber}</p>
              <p><strong>Address:</strong> {selectedCustomer.address}</p>
              <p><strong>ID Proof:</strong> {selectedCustomer.idProof} - {selectedCustomer.idProofNumber}</p>
              <p><strong>Occupation:</strong> {selectedCustomer.occupation || 'N/A'}</p>
              <p><strong>Annual Income:</strong> ₹{selectedCustomer.annualIncome?.toLocaleString() || 0}</p>
              <p><strong>Status:</strong> {selectedCustomer.active ? 'Active' : 'Inactive'}</p>
              <p><strong>Created:</strong> {new Date(selectedCustomer.createdAt).toLocaleString()}</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;