import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaGem, FaWeight, FaTag, FaCamera } from 'react-icons/fa'; 
import './GoldItems.css';
import { useNepaliNumber } from '../hooks/useNepaliNumber';
import { 
  formatCurrency, 
  formatWeight, 
  toNepaliDigits,
  toEnglishDigits 
} from '../utils/nepaliFormat';
import WebcamCapture from './WebcamCapture'; 
import api from '../services/api';

const GoldItems = ({ token }) => {
  const { t, i18n } = useTranslation();
  const currentLng = i18n.language;
  const { convertNumber, convertCurrency: convertCurrencyHook, convertWeight: convertWeightHook } = useNepaliNumber();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [showWebcam, setShowWebcam] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    itemType: 'Necklace',
    weightInGrams: '',
    purity: '22K',
    description: '',
    estimatedValue: '',
    loanNumber: '',
    imageUrl: '' 
  });

  useEffect(() => {
    fetchGoldItems();
    fetchCustomers();
  }, []);

  const fetchGoldItems = async () => {
    try {
      const response = await api.get('/admin/gold-items', {
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
      const response = await api.get('/admin/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const englishValue = toEnglishDigits(value);
    setFormData({
      ...formData,
      [name]: englishValue
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebcamCapture = (imageBase64) => {
    setFormData({ ...formData, imageUrl: imageBase64 });
  };

  const displayValue = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return currentLng === 'ne' ? toNepaliDigits(value.toString()) : value.toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/admin/gold-items/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post('/admin/gold-items', formData, {
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
    if (window.confirm(t('gold_items.confirm_delete'))) {
      try {
        await api.delete(`/admin/gold-items/${id}`, {
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
      estimatedValue: item.estimatedValue,
      loanNumber: item.loanNumber || '',
      imageUrl: item.imageUrl || '' 
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
      estimatedValue: '',
      loanNumber: '',
      imageUrl: '' 
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
    item.purity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.loanNumber?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1>{t('gold_items.title')}</h1>
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={t('gold_items.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <FaPlus /> {t('gold_items.add')}
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <FaGem className="stat-icon" />
          <div className="stat-info">
            <h3>{t('gold_items.stats.total_items')}</h3>
            <p>{convertNumber(items.length)}</p>
          </div>
        </div>
        <div className="stat-card">
          <FaWeight className="stat-icon" />
          <div className="stat-info">
            <h3>{t('gold_items.stats.total_weight')}</h3>
            <p>{convertWeightHook(items.reduce((sum, item) => sum + (item.weightInGrams || 0), 0))}</p>
          </div>
        </div>
        <div className="stat-card">
          <FaTag className="stat-icon" />
          <div className="stat-info">
            <h3>{t('gold_items.stats.total_value')}</h3>
            <p>{convertCurrencyHook(items.reduce((sum, item) => sum + (parseFloat(item.estimatedValue) || 0), 0))}</p>
          </div>
        </div>
      </div>

      <div className="items-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="item-card">
            {item.imageUrl && (
              <div className="item-image">
                <img src={item.imageUrl} alt={item.itemType} />
              </div>
            )}
            <div className="item-header">
              <h3>{t(`item_types.${item.itemType}`, item.itemType)}</h3>
              <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                {t(`gold_items.status.${item.status}`, item.status || 'AVAILABLE')}
              </span>
            </div>
            <div className="item-details">
              <p><strong>{t('gold_items.fields.owner')}:</strong> {item.customerName || getCustomerName(item.customerId)}</p>
              {item.loanNumber && (
              <p>
              <strong>{t('gold_items.fields.loan_number')}:</strong>{' '}
              <span className="loan-number-tag">{displayValue(item.loanNumber)}</span>
              </p>
            )}
              <p><strong>{t('gold_items.fields.weight')}:</strong> {convertWeightHook(item.weightInGrams)}</p>
              <p><strong>{t('gold_items.fields.purity')}:</strong> {currentLng === 'ne' ? toNepaliDigits(item.purity) : item.purity}</p>
              <p><strong>{t('gold_items.fields.estimated_value')}:</strong> {convertCurrencyHook(item.estimatedValue)}</p>
              {item.description && <p><strong>{t('gold_items.fields.description')}:</strong> {item.description}</p>}
            </div>
            <div className="item-actions">
              <button className="edit-btn" onClick={() => handleEdit(item)} title={t('customers.edit_action')}>
                <FaEdit />
              </button>
              <button className="delete-btn" onClick={() => handleDelete(item.id)} title={t('customers.delete')}>
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingItem ? t('gold_items.edit') : t('gold_items.add_new')}</h2>
            {formData.loanNumber && (
              <div className="loan-association-info">
                <strong>{t('gold_items.fields.customer_loan_serial')}:</strong> <span className="loan-number-tag">{displayValue(formData.loanNumber)}</span>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="image-upload-group" style={{ width: '100%', marginBottom: '10px' }}>
                  <label>{t('gold_items.fields.image', 'Gold Image')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {formData.imageUrl && (
                      <img src={formData.imageUrl} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={() => setShowWebcam(true)} className="camera-btn">
                      <FaCamera /> {t('common.capture', 'Capture')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t('loans.select_customer')}</option>
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
                  <option value="Necklace">{t('item_types.Necklace')}</option>
                  <option value="Ring">{t('item_types.Ring')}</option>
                  <option value="Earring">{t('item_types.Earring')}</option>
                  <option value="Bracelet">{t('item_types.Bracelet')}</option>
                  <option value="Chain">{t('item_types.Chain')}</option>
                  <option value="Coin">{t('item_types.Coin')}</option>
                  <option value="Other">{t('item_types.Other')}</option>
                </select>
              </div>

              <div className="form-row">
                <input
                  type="text"
                  name="weightInGrams"
                  placeholder={t('gold_items.fields.weight')}
                  value={displayValue(formData.weightInGrams)}
                  onChange={handleInputChange}
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
                  type="text"
                  name="estimatedValue"
                  placeholder={t('gold_items.fields.estimated_value')}
                  value={displayValue(formData.estimatedValue)}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <textarea
                  name="description"
                  placeholder={t('gold_items.fields.description')}
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
                  {t('common.cancel')}
                </button>
                <button type="submit" className="submit-btn">
                  {editingItem ? t('customers.edit_action') : t('gold_items.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWebcam && (
        <WebcamCapture
          onCapture={handleWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </div>
  );
};

export default GoldItems;