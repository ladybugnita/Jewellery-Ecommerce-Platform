import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import './AdminManagement.css';
import { 
  FaPlus, FaTrash, FaEnvelope, FaUserCog, FaEdit, FaUser, 
  FaKey, FaPhone, FaBriefcase, FaDollarSign, FaCheck, FaTimes,
  FaUsers, FaUserPlus, FaUserMinus, FaToggleOn, FaToggleOff
} from 'react-icons/fa';

const AdminManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const userRole = localStorage.getItem('userRole');
  
  useEffect(() => {
    if (userRole !== 'ADMIN') {
      window.location.href = '/user/dashboard';
    }
  }, [userRole]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'STAFF',
    permissions: [],
    employeeId: '',
    department: '',
    designation: '',
    salary: '',
    canCreateCustomers: false,
    canEditCustomers: false,
    canDeleteCustomers: false,
    canCreateLoans: false,
    canApproveLoans: false,
    canProcessPayments: false,
    canViewReports: false,
    canManageUsers: false,
    maxLoanApprovalLimit: '',
    maxLoanTenureMonths: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getAllUsers(); 
      console.log('Fetched users:', res.data.data);  
      setUsers([...res.data.data]); 
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: t('admin.fetch_failed') });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      role: 'STAFF',
      permissions: [],
      employeeId: '',
      department: '',
      designation: '',
      salary: '',
      canCreateCustomers: false,
      canEditCustomers: false,
      canDeleteCustomers: false,
      canCreateLoans: false,
      canApproveLoans: false,
      canProcessPayments: false,
      canViewReports: false,
      canManageUsers: false,
      maxLoanApprovalLimit: '',
      maxLoanTenureMonths: ''
    });
    setEditingUser(null);
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        maxLoanApprovalLimit: formData.maxLoanApprovalLimit ? parseFloat(formData.maxLoanApprovalLimit) : null,
        maxLoanTenureMonths: formData.maxLoanTenureMonths ? parseInt(formData.maxLoanTenureMonths) : null
      };

      if (editingUser) {
        const response = await adminAPI.updateUserRole(editingUser.id, payload);
        console.log('Update response:', response.data.data); 
        setMessage({ type: 'success', text: t('admin.user_updated') });
      } else {
        await adminAPI.createUserWithRole(payload);
        setMessage({ type: 'success', text: t('admin.user_created') });
      }
      await fetchUsers();
      console.log('Users after update should be refreshed'); 
      
      setTimeout(() => {
        const updatedUser = users.find(u => u.id === (editingUser?.id));
        if (updatedUser) {
          console.log('After fetch, updated user data:', updatedUser);
        }
      }, 100);
      
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || t('admin.operation_failed') });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'STAFF',
      permissions: user.permissions || [],
      employeeId: user.employeeId || '',
      department: user.department || '',
      designation: user.designation || '',
      salary: user.salary || '',
      canCreateCustomers: user.canCreateCustomers || false,
      canEditCustomers: user.canEditCustomers || false,
      canDeleteCustomers: user.canDeleteCustomers || false,
      canCreateLoans: user.canCreateLoans || false,
      canApproveLoans: user.canApproveLoans || false,
      canProcessPayments: user.canProcessPayments || false,
      canViewReports: user.canViewReports || false,
      canManageUsers: user.canManageUsers || false,
      maxLoanApprovalLimit: user.maxLoanApprovalLimit || '',
      maxLoanTenureMonths: user.maxLoanTenureMonths || ''
    });
    setShowAddModal(true);
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.active) {
        await adminAPI.deactivateUser(user.id);
      } else {
        await adminAPI.activateUser(user.id);
      }
      fetchUsers();
      setMessage({ type: 'success', text: t('admin.status_changed') });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: t('admin.operation_failed') });
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
    <div className="admin-management fade-in">
      <h1>{t('admin.management')}</h1>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="admin-card">
        <div className="card-header">
          <h2>{t('admin.users_list')}</h2>
          <button className="add-button" onClick={() => setShowAddModal(true)}>
            <FaUserPlus /> {t('admin.add_new_user')}
          </button>
        </div>

        <div className="user-list">
          {console.log('Rendering user list, length:', users.length)} 
          {users.length > 0 ? (
            users.map(user => (
              <div key={user.id} className="user-item">
                <div className="user-info">
                  <FaUser className="user-icon" />
                  <div className="user-details">
                    <strong>{user.username}</strong> ({user.email})
                    <br />
                    <small>
                      {t('roles.' + user.role, user.role)} | 
                      {user.active ? 
                        <span className="status-active"> {t('admin.active')}</span> : 
                        <span className="status-inactive"> {t('admin.inactive')}</span>
                      }
                    </small>
                  </div>
                </div>
                <div className="user-actions">
                  <button className="edit-btn" onClick={() => handleEdit(user)}>
                    <FaEdit />
                  </button>
                  <button className="toggle-btn" onClick={() => handleToggleActive(user)}>
                    {user.active ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">{t('admin.no_users')}</p>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal">
          <div className="modal-content large">
            <h2>{editingUser ? t('admin.edit_user') : t('admin.add_new_user')}</h2>
            <form onSubmit={handleCreateOrUpdate}>
              <div className="form-row">
                <input
                  type="text"
                  name="username"
                  placeholder={t('admin.username')}
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder={t('admin.email')}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {!editingUser && (
                <div className="form-row">
                  <input
                    type="password"
                    name="password"
                    placeholder={t('admin.password')}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}
              <div className="form-row">
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder={t('admin.phone')}
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
                <select name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="ADMIN">{t('roles.ADMIN')}</option>
                  <option value="STAFF">{t('roles.STAFF')}</option>
                  <option value="USER">{t('roles.USER')}</option>
                </select>
              </div>

              {formData.role !== 'USER' && (
                <>
                  <div className="form-row">
                    <input
                      type="text"
                      name="employeeId"
                      placeholder={t('admin.employee_id')}
                      value={formData.employeeId}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      name="department"
                      placeholder={t('admin.department')}
                      value={formData.department}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-row">
                    <input
                      type="text"
                      name="designation"
                      placeholder={t('admin.designation')}
                      value={formData.designation}
                      onChange={handleInputChange}
                    />
                    <input
                      type="number"
                      name="salary"
                      placeholder={t('admin.salary')}
                      value={formData.salary}
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}

              {formData.role !== 'USER' && (
                <div className="permissions-section">
                  <h4>{t('admin.permissions')}</h4>
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="canCreateCustomers"
                        checked={formData.canCreateCustomers}
                        onChange={handleInputChange}
                      /> {t('admin.can_create_customers')}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="canEditCustomers"
                        checked={formData.canEditCustomers}
                        onChange={handleInputChange}
                      /> {t('admin.can_edit_customers')}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="canDeleteCustomers"
                        checked={formData.canDeleteCustomers}
                        onChange={handleInputChange}
                      /> {t('admin.can_delete_customers')}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="canCreateLoans"
                        checked={formData.canCreateLoans}
                        onChange={handleInputChange}
                      /> {t('admin.can_create_loans')}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="canApproveLoans"
                        checked={formData.canApproveLoans}
                        onChange={handleInputChange}
                      /> {t('admin.can_approve_loans')}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="canProcessPayments"
                        checked={formData.canProcessPayments}
                        onChange={handleInputChange}
                      /> {t('admin.can_process_payments')}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="canViewReports"
                        checked={formData.canViewReports}
                        onChange={handleInputChange}
                      /> {t('admin.can_view_reports')}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="canManageUsers"
                        checked={formData.canManageUsers}
                        onChange={handleInputChange}
                      /> {t('admin.can_manage_users')}
                    </label>
                  </div>

                  <div className="form-row">
                    <input
                      type="number"
                      name="maxLoanApprovalLimit"
                      placeholder={t('admin.max_loan_approval_limit')}
                      value={formData.maxLoanApprovalLimit}
                      onChange={handleInputChange}
                    />
                    <input
                      type="number"
                      name="maxLoanTenureMonths"
                      placeholder={t('admin.max_loan_tenure_months')}
                      value={formData.maxLoanTenureMonths}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="submit-btn">
                  {editingUser ? t('common.update') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;