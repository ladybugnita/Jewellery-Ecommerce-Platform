import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
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

const Sidebar = ({ onLogout }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <FaGem className="sidebar-logo" />
        <h2>Jewellery Admin</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaTachometerAlt className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/customers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaUsers className="nav-icon" />
          <span>Customers</span>
        </NavLink>

        <NavLink to="/gold-items" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaRing className="nav-icon" />
          <span>Gold Items</span>
        </NavLink>
         
         <NavLink to="/admin-management" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
           <FaUserCog className="nav-icon" />
           <span>Admin Management</span>
         </NavLink>

        <NavLink to="/loans" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaMoneyBillWave className="nav-icon" />
          <span>Loans</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/" className="nav-link">
          <FaHome className="nav-icon" />
          <span>Home</span>
        </NavLink>
        <button onClick={onLogout} className="logout-button">
          <FaSignOutAlt className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;