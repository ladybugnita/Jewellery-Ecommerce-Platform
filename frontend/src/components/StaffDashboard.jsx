import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { FaUsers, FaMoneyBillWave, FaClock } from 'react-icons/fa';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await userAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (err) {
      console.error('Failed to load staff dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const staffData = dashboardData?.staffData;

  return (
    <div className="staff-dashboard fade-in">
      <h1>{t('staff.dashboard.title')}</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <div className="stat-info">
            <h3>{t('staff.dashboard.total_customers')}</h3>
            <p>{staffData?.totalCustomers || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaMoneyBillWave className="stat-icon" />
          <div className="stat-info">
            <h3>{t('staff.dashboard.active_loans')}</h3>
            <p>{staffData?.totalActiveLoans || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaClock className="stat-icon" />
          <div className="stat-info">
            <h3>{t('staff.dashboard.pending_approvals')}</h3>
            <p>{staffData?.pendingApprovals || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;