import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Notifications from './Notifications';
import {
  FaGem,
  FaTachometerAlt,
  FaUsers,
  FaRing,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaHome,
  FaUserCog
} from 'react-icons/fa';
import './Sidebar.css';

const AdminSidebar = ({ onLogout }) => {
  const { t } = useTranslation();

  return (
    <div className="sidebar">

      <div className="sidebar-header">

        <div className="header-top">
          <FaGem className="sidebar-logo" />
          <Notifications />
        </div>

        <h2>{t('nav.dashboard')}</h2>

        <div className="user-role-tag">
          {t('roles.ADMIN')}
        </div>

      </div>

      <nav className="sidebar-nav">

        <NavLink to="/admin/dashboard" className="nav-link">
          <FaTachometerAlt className="nav-icon" />
          {t('nav.dashboard')}
        </NavLink>

        <NavLink to="/admin/customers" className="nav-link">
          <FaUsers className="nav-icon" />
          {t('nav.customers')}   
        </NavLink>

        <NavLink to="/admin/gold-items" className="nav-link">
          <FaRing className="nav-icon" />
          {t('nav.gold_items')}
        </NavLink>

        <NavLink to="/admin/loans" className="nav-link">
          <FaMoneyBillWave className="nav-icon" />
          {t('nav.loans')}
        </NavLink>

        <NavLink to="/admin/management" className="nav-link">
          <FaUserCog className="nav-icon" />
          {t('nav.management')}
        </NavLink>

      </nav>

      <div className="sidebar-footer">

        <NavLink to="/" className="nav-link">
          <FaHome className="nav-icon" />
          {t('nav.home')}
        </NavLink>

        <button onClick={onLogout} className="logout-button">
          <FaSignOutAlt className="nav-icon" />
          {t('nav.logout')}
        </button>

      </div>

    </div>
  );
};

export default AdminSidebar;