import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './CustomerList.css';
import { adminAPI } from '../services/api';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaEye, FaCamera } from 'react-icons/fa'; 
import { useNepaliNumber } from '../hooks/useNepaliNumber';
import { formatDateTime, toNepaliDigits, toEnglishDigits } from '../utils/nepaliFormat';
import WebcamCapture from './WebcamCapture'; 

const CustomerList = ({ token }) => {
  const { t, i18n } = useTranslation();
  const currentLng = i18n.language;
  const { convertCurrency } = useNepaliNumber();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
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
    annualIncome: '',
    profileImage: '' 
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
        setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebcamCapture = (imageBase64) => {
    setFormData({ ...formData, profileImage: imageBase64 });
  };

  const displayValue = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return currentLng === 'ne' ? toNepaliDigits(value.toString()) : value.toString();
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
      alert(t('customers.save_failed') + ': ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('customers.confirm_delete'))) {
      try {
        await adminAPI.deleteCustomer(id);
        fetchCustomers();
      } catch (err) {
        console.error('Failed to delete customer:', err);
        alert(t('customers.delete_failed'));
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
      annualIncome: customer.annualIncome || '',
      profileImage: customer.profileImage || '' 
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
      annualIncome: '',
      profileImage: '' 
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
        <h1>{t('customers.title')}</h1>
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={t('customers.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <FaPlus /> {t('customers.add')}
          </button>
        </div>
      </div>

      <div className="customers-grid">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="customer-card">
            <div className="customer-avatar">
              {customer.profileImage ? (
                <img src={customer.profileImage} alt={customer.fullName} className="avatar-image" />
              ) : (
                customer.fullName?.charAt(0) || 'C'
              )}
            </div>
            <div className="customer-info">
              <h3>{customer.fullName}</h3>
              <p className="customer-email">{customer.email}</p>
              <p className="customer-phone">{displayValue(customer.phoneNumber)}</p>
              <p className="customer-address">{customer.address}</p>
              <div className="customer-details">
                <span className="badge">{customer.occupation || 'N/A'}</span>
                <span className="badge">{convertCurrency(customer.annualIncome)}</span>
              </div>
            </div>
            <div className="customer-actions">
              <button className="view-btn" onClick={() => handleView(customer)} title={t('customers.view')}>
                <FaEye />
              </button>
              <button className="edit-btn" onClick={() => handleEdit(customer)} title={t('customers.edit_action')}>
                <FaEdit />
              </button>
              <button className="delete-btn" onClick={() => handleDelete(customer.id)} title={t('customers.delete')}>
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingCustomer ? t('customers.edit') : t('customers.add_new')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="image-upload-group" style={{ width: '100%', marginBottom: '10px' }}>
                  <label>{t('customers.profile_image', 'Profile Image')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {formData.profileImage && (
                      <img src={formData.profileImage} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
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
                <input
                  type="text"
                  name="username"
                  placeholder={t('customers.username')}
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder={t('customers.email')}
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
                    placeholder={t('customers.password')}
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
                  placeholder={t('customers.full_name')}
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder={t('customers.phone')}
                  value={displayValue(formData.phoneNumber)}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="address"
                  placeholder={t('customers.address')}
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
                <select
                  name="idProof"
                  value={formData.idProof}
                  onChange={handleInputChange}
                >
                  <option value="citizenship">{t('customers.id_proof_types.citizenship')}</option>
                  <option value="passport">{t('customers.id_proof_types.passport')}</option>
                  <option value="driving_license">{t('customers.id_proof_types.driving_license')}</option>
                </select>
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="idProofNumber"
                  placeholder={t('customers.id_proof_number')}
                  value={displayValue(formData.idProofNumber)}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="occupation"
                  placeholder={t('customers.occupation')}
                  value={formData.occupation}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="annualIncome"
                  placeholder={t('customers.annual_income')}
                  value={displayValue(formData.annualIncome)}
                  onChange={handleInputChange}
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
                  {editingCustomer ? t('customers.edit_action') : t('customers.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedCustomer && (
        <div className="modal">
          <div className="modal-content">
            <h2>{t('customers.details')}</h2>
            {selectedCustomer.profileImage && (
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <img src={selectedCustomer.profileImage} alt={selectedCustomer.fullName} style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }} />
              </div>
            )}
            <div className="customer-details-view">
              <p><strong>{t('customers.full_name')}:</strong> {selectedCustomer.fullName}</p>
              <p><strong>{t('customers.username')}:</strong> {selectedCustomer.username}</p>
              <p><strong>{t('customers.email')}:</strong> {selectedCustomer.email}</p>
              <p><strong>{t('customers.phone')}:</strong> {displayValue(selectedCustomer.phoneNumber)}</p>
              <p><strong>{t('customers.address')}:</strong> {selectedCustomer.address}</p>
              <p><strong>{t('customers.id_proof')}:</strong> {t(`customers.id_proof_types.${selectedCustomer.idProof}`)} - {displayValue(selectedCustomer.idProofNumber)}</p>
              <p><strong>{t('customers.occupation')}:</strong> {selectedCustomer.occupation || 'N/A'}</p>
              <p><strong>{t('customers.annual_income')}:</strong> {convertCurrency(selectedCustomer.annualIncome)}</p>
              <p><strong>{t('customers.status')}:</strong> {selectedCustomer.active ? t('customers.active') : t('customers.inactive')}</p>
              <p><strong>{t('customers.created')}:</strong> {formatDateTime(selectedCustomer.createdAt, currentLng)}</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowViewModal(false)}>
                {t('common.close')}
              </button>
            </div>
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

export default CustomerList;