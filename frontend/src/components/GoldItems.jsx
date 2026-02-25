import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaGem, FaWeight, FaTag } from 'react-icons/fa';
import './GoldItems.css';

const GoldItems = ({ token }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    itemType: 'Necklace',
    weightInGrams: '',
    purity: '22K',
    description: '',
    estimatedValue: ''
  });

  useEffect(() => {
    fetchGoldItems();
    fetchCustomers();
  }, []);

  const fetchGoldItems = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/admin/gold-items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch gold items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
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
      if (editingItem) {
        await axios.put(`http://localhost:8080/api/admin/gold-items/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:8080/api/admin/gold-items', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchGoldItems();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save gold item:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this gold item?')) {
      try {
        await axios.delete(`http://localhost:8080/api/admin/gold-items/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchGoldItems();
      } catch (err) {
        console.error('Failed to delete gold item:', err);
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      customerId: item.customerId,
      itemType: item.itemType,
      weightInGrams: item.weightInGrams,
      purity: item.purity,
      description: item.description || '',
      estimatedValue: item.estimatedValue
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      customerId: '',
      itemType: 'Necklace',
      weightInGrams: '',
      purity: '22K',
      description: '',
      estimatedValue: ''
    });
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.fullName : 'Unknown';
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'AVAILABLE': return 'badge-success';
      case 'PLEDGED': return 'badge-warning';
      case 'PLEDGED_TO_BANK': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  const filteredItems = items.filter(item =>
    item.itemType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCustomerName(item.customerId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.purity?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="gold-items fade-in">
      <div className="list-header">
        <h1>Gold Items Inventory</h1>
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <FaPlus /> Add Gold Item
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <FaGem className="stat-icon" />
          <div className="stat-info">
            <h3>Total Items</h3>
            <p>{items.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <FaWeight className="stat-icon" />
          <div className="stat-info">
            <h3>Total Weight</h3>
            <p>{items.reduce((sum, item) => sum + (item.weightInGrams || 0), 0).toFixed(2)} g</p>
          </div>
        </div>
        <div className="stat-card">
          <FaTag className="stat-icon" />
          <div className="stat-info">
            <h3>Total Value</h3>
            <p>₹{items.reduce((sum, item) => sum + (parseFloat(item.estimatedValue) || 0), 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="items-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="item-card">
            <div className="item-header">
              <h3>{item.itemType}</h3>
              <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                {item.status || 'AVAILABLE'}
              </span>
            </div>
            <div className="item-details">
              <p><strong>Owner:</strong> {getCustomerName(item.customerId)}</p>
              <p><strong>Weight:</strong> {item.weightInGrams} g</p>
              <p><strong>Purity:</strong> {item.purity}</p>
              <p><strong>Est. Value:</strong> ₹{parseFloat(item.estimatedValue).toLocaleString()}</p>
              {item.description && <p><strong>Description:</strong> {item.description}</p>}
            </div>
            <div className="item-actions">
              <button className="edit-btn" onClick={() => handleEdit(item)}>
                <FaEdit />
              </button>
              <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingItem ? 'Edit Gold Item' : 'Add New Gold Item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName} ({customer.email})
                    </option>
                  ))}
                </select>

                <select
                  name="itemType"
                  value={formData.itemType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Necklace">Necklace</option>
                  <option value="Ring">Ring</option>
                  <option value="Earring">Earring</option>
                  <option value="Bracelet">Bracelet</option>
                  <option value="Chain">Chain</option>
                  <option value="Coin">Coin</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-row">
                <input
                  type="number"
                  name="weightInGrams"
                  placeholder="Weight (grams)"
                  value={formData.weightInGrams}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />

                <select
                  name="purity"
                  value={formData.purity}
                  onChange={handleInputChange}
                  required
                >
                  <option value="24K">24K (99.9%)</option>
                  <option value="22K">22K (91.6%)</option>
                  <option value="18K">18K (75%)</option>
                  <option value="14K">14K (58.5%)</option>
                  <option value="10K">10K (41.7%)</option>
                </select>
              </div>

              <div className="form-row">
                <input
                  type="number"
                  name="estimatedValue"
                  placeholder="Estimated Value (₹)"
                  value={formData.estimatedValue}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <textarea
                  name="description"
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
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
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldItems;