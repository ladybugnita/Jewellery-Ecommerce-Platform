import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { FaMoneyBillWave, FaGem } from 'react-icons/fa';
import './UserDashboard.css';
import { useNepaliNumber } from '../hooks/useNepaliNumber';
import { 
  toNepaliDigits, 
  formatNumberNepali,
  formatCurrency,
  formatNumber 
} from '../utils/nepaliFormat';

const UserDashboard = () => {
  const { t, i18n } = useTranslation();
  const currentLng = i18n.language;
  const { convertNumber, convertCurrency } = useNepaliNumber();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const displayValue = (value) => {
    if (value === null || value === undefined) return '';
    return currentLng === 'ne' ? toNepaliDigits(value.toString()) : value.toString();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching user dashboard data...');
      const response = await userAPI.getDashboard();
      console.log('Dashboard response:', response.data);
      
      if (response.data.success) {
        setDashboardData(response.data.data);
        setError('');
      } else {
        setError(response.data.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('user.dashboard.greeting.morning');
    if (hour < 17) return t('user.dashboard.greeting.afternoon');
    return t('user.dashboard.greeting.evening');
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const role = localStorage.getItem('userRole') || 'CUSTOMER';

  return (
    <div className="user-dashboard fade-in">
      {error && <div className="error-message">{error}</div>}
      
      <div className="welcome-section">
        <h1>{getGreeting()}</h1>
        <p className="role-badge">{t(`roles.${role}`)}</p>
        {dashboardData?.currentDate && (
          <div className="date-info">
            <p className="english-date">{dashboardData.currentDate.english}</p>
            <p className="nepali-date">{displayValue(dashboardData.currentDate.nepali)}</p>
          </div>
        )}
      </div>

      <div className="dashboard-content">
        {role === 'CUSTOMER' && dashboardData?.customerData ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <FaMoneyBillWave className="stat-icon" />
                <div className="stat-info">
                  <h3>{t('user.dashboard.stats.total_loans')}</h3>
                  <p>{convertNumber(dashboardData.customerData.totalLoans || 0)}</p>
                </div>
              </div>
              <div className="stat-card">
                <FaMoneyBillWave className="stat-icon" />
                <div className="stat-info">
                  <h3>{t('user.dashboard.stats.active_loans')}</h3>
                  <p>{convertNumber(dashboardData.customerData.activeLoans || 0)}</p>
                </div>
              </div>
              <div className="stat-card">
                <FaGem className="stat-icon" />
                <div className="stat-info">
                  <h3>{t('user.dashboard.stats.gold_items')}</h3>
                  <p>{convertNumber(dashboardData.customerData.totalGoldItems || 0)}</p>
                </div>
              </div>
            </div>

            {dashboardData.customerData.recentLoans?.length > 0 && (
              <div className="recent-section">
                <h2>{t('user.dashboard.recent_loans')}</h2>
                <div className="recent-list">
                  {dashboardData.customerData.recentLoans.map(loan => (
                    <div key={loan.id} className="recent-item">
                      <span className="loan-number">{displayValue(loan.loanNumber)}</span>
                      <span className="loan-amount">
                        {convertCurrency(loan.principalAmount)}
                      </span>
                      <span className={`loan-status ${loan.status?.toLowerCase()}`}>
                        {t(`status.${loan.status}`, loan.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : role === 'CUSTOMER' && !dashboardData?.customerData ? (
          <div className="empty-state">
            <p>{t('user.dashboard.empty.customer')}</p>
          </div>
        ) : role === 'STAFF' && dashboardData?.staffData ? (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{t('dashboard.total_customers')}</h3>
              <p>{convertNumber(dashboardData.staffData.totalCustomers)}</p>
            </div>
            <div className="stat-card">
              <h3>{t('dashboard.active_loans')}</h3>
              <p>{convertNumber(dashboardData.staffData.totalActiveLoans)}</p>
            </div>
            <div className="stat-card">
              <h3>{t('dashboard.pending_approvals')}</h3>
              <p>{convertNumber(dashboardData.staffData.pendingApprovals)}</p>
            </div>
          </div>
        ) : role === 'USER' && dashboardData?.userData ? (
          <div className="welcome-message">
            <h2>{dashboardData.userData.message}</h2>
            <ul className="feature-list">
              {dashboardData.userData.features?.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('user.dashboard.empty.default')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;