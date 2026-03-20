import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';
import Notifications from './Notifications';
import { userAPI } from '../services/api';
import { 
  FaGem, 
  FaTachometerAlt, 
  FaRing, 
  FaMoneyBillWave,
  FaSignOutAlt,
  FaHome,
  FaUser,
  FaPlus,
  FaUsers,
  FaClock
} from 'react-icons/fa';

const UserSidebar = ({ onLogout }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setUser(response.data.data);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const role = user?.role;
  const permissions = user || {};

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="header-top">
          <FaGem className="sidebar-logo" />
          <Notifications />
        </div>
        <h2>{t(`roles.${role}`)} {t('nav.dashboard')}</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to={role === 'ADMIN' ? "/admin/dashboard" : (role === 'STAFF' ? "/staff/dashboard" : "/user/dashboard")}
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <FaTachometerAlt className="nav-icon" />
          <span>{t('nav.dashboard')}</span>
        </NavLink>

        <NavLink to="/user/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaUser className="nav-icon" />
          <span>{t('nav.profile')}</span>
        </NavLink>

        {role === 'CUSTOMER' && (
          <>
            <NavLink to="/user/my-loans" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <FaMoneyBillWave className="nav-icon" />
              <span>{t('nav.loans')}</span>
            </NavLink>
            <NavLink to="/user/request-loan" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <FaPlus className="nav-icon" />
              <span>{t('nav.request_loan')}</span>
            </NavLink>
            <NavLink to="/user/my-gold-items" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <FaRing className="nav-icon" />
              <span>{t('nav.gold_items')}</span>
            </NavLink>
          </>
        )}

        {role === 'STAFF' && (
          <>
            {permissions.canCreateCustomers && (
              <NavLink to="/staff/customers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FaUsers className="nav-icon" />
                <span>{t('staff.customers')}</span>
              </NavLink>
            )}
            {permissions.canApproveLoans && (
              <NavLink to="/staff/pending-loans" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FaClock className="nav-icon" />
                <span>{t('staff.pending_approvals')}</span>
              </NavLink>
            )}
          </>
        )}

        {role === 'ADMIN' && (
          <>
            <NavLink to="/admin/customers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <FaUsers className="nav-icon" />
              <span>{t('admin.customers')}</span>
            </NavLink>
            <NavLink to="/admin/gold-items" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <FaRing className="nav-icon" />
              <span>{t('nav.gold_items')}</span>
            </NavLink>
            <NavLink to="/admin/loans" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <FaMoneyBillWave className="nav-icon" />
              <span>{t('nav.loans')}</span>
            </NavLink>
            <NavLink to="/admin/management" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <FaUsers className="nav-icon" />
              <span>{t('admin.management')}</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/" className="nav-link">
          <FaHome className="nav-icon" />
          <span>{t('nav.home')}</span>
        </NavLink>
        <button onClick={onLogout} className="logout-button">
          <FaSignOutAlt className="nav-icon" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default UserSidebar;