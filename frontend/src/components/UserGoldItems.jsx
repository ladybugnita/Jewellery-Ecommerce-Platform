import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { FaRing, FaWeight, FaTag, FaEye } from 'react-icons/fa';
import './UserGoldItems.css';
import { useNepaliNumber } from '../hooks/useNepaliNumber';
import { 
  formatCurrency, 
  formatWeight, 
  toNepaliDigits,
  formatNumberNepali 
} from '../utils/nepaliFormat';

const UserGoldItems = () => {
  const { t, i18n } = useTranslation();
  const currentLng = i18n.language;
  const { convertNumber, convertCurrency: convertCurrencyHook, convertWeight: convertWeightHook } = useNepaliNumber();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const displayValue = (value) => {
    if (value === null || value === undefined) return '';
    return currentLng === 'ne' ? toNepaliDigits(value.toString()) : value.toString();
  };

  const displayPurity = (purity) => {
    if (!purity) return '';
    return currentLng === 'ne' ? toNepaliDigits(purity) : purity;
  };

  useEffect(() => {
    fetchGoldItems();
  }, []);

  const fetchGoldItems = async () => {
    try {
      console.log('Fetching user gold items...');
      const response = await userAPI.getMyGoldItems();
      console.log('Gold items response:', response.data);
      setItems(response.data.data || []);
    } catch (err) {
      console.error('Failed to load gold items:', err);
      setError('Failed to load gold items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'AVAILABLE': return 'badge-success';
      case 'PLEDGED': return 'badge-warning';
      case 'PLEDGED_TO_BANK': return 'badge-info';
      default: return 'badge-secondary';
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
    <div className="user-gold-items fade-in">
      {error && <div className="error-message">{error}</div>}
      
      <h1>{t('user.gold_items.title')}</h1>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>{t('user.gold_items.empty')}</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
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
                <p><FaWeight /> <strong>{t('user.gold_items.fields.weight')}:</strong> {convertWeightHook(item.weightInGrams)}</p>
                <p><FaTag /> <strong>{t('user.gold_items.fields.purity')}:</strong> {displayPurity(item.purity)}</p>
                <p><strong>{t('user.gold_items.fields.estimated_value')}:</strong> {convertCurrencyHook(item.estimatedValue)}</p>
                {item.loanNumber ? (
                  <p><FaRing /> <strong>{t('user.gold_items.fields.loan_number')}:</strong> {displayValue(item.loanNumber)}</p>
                ) : (
                  <p><strong>{t('user.gold_items.fields.serial_number')}:</strong> {displayValue(item.serialNumber || 'N/A')}</p>
                )}
                {item.description && <p><strong>{t('user.gold_items.fields.description')}:</strong> {item.description}</p>}
              </div>
              <button className="view-details-btn" onClick={() => handleViewDetails(item)}>
                <FaEye /> {t('user.gold_items.view_details')}
              </button>
            </div>
          ))}
        </div>
      )}

      {showDetailsModal && selectedItem && (
        <div className="modal">
          <div className="modal-content">
            <h2>{t('user.gold_items.view_details')}</h2>
            {selectedItem.imageUrl && (
              <div className="detail-image">
                <img src={selectedItem.imageUrl} alt={selectedItem.itemType} />
              </div>
            )}
            <div className="item-details-view">
              <p><strong>{t('user.gold_items.fields.item_type')}:</strong> {t(`item_types.${selectedItem.itemType}`, selectedItem.itemType)}</p>
              {selectedItem.loanNumber ? (
                <p><strong>{t('user.gold_items.fields.loan_number')}:</strong> {displayValue(selectedItem.loanNumber)}</p>
              ) : (
                <p><strong>{t('user.gold_items.fields.serial_number')}:</strong> {displayValue(selectedItem.serialNumber || 'N/A')}</p>
              )}
              <p><strong>{t('user.gold_items.fields.weight')}:</strong> {convertWeightHook(selectedItem.weightInGrams)}</p>
              <p><FaTag /> <strong>{t('user.gold_items.fields.purity')}:</strong> {displayPurity(selectedItem.purity)}</p>
              <p><strong>{t('user.gold_items.fields.estimated_value')}:</strong> {convertCurrencyHook(selectedItem.estimatedValue)}</p>
              <p><strong>{t('user.gold_items.fields.status')}:</strong> <span className={`status-badge ${getStatusBadgeClass(selectedItem.status)}`}>{t(`gold_items.status.${selectedItem.status}`, selectedItem.status)}</span></p>
              {selectedItem.description && <p><strong>{t('user.gold_items.fields.description')}:</strong> {selectedItem.description}</p>}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDetailsModal(false)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGoldItems;