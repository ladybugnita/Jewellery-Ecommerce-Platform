import axios from 'axios';
import i18n from '../i18n';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    if(!config.url.startsWith('/auth/')) {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

    console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);

    console.log('Response data structure:', {
      hasData: !!response.data,
      hasDataProperty: !!(response.data && response.data.data),
      dataType: typeof response.data
    });

    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      console.log('Unauthorized - redirecting to login');

      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');

      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  saveSnapshot: () => api.post('/admin/dashboard/snapshot'),

  getCustomers: () => api.get('/admin/customers'),
  getCustomer: (id) => api.get(`/admin/customers/${id}`),
  createCustomer: (data) => api.post('/admin/customers', data),
  updateCustomer: (id, data) => api.put(`/admin/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/admin/customers/${id}`),

  getGoldItems: () => api.get('/admin/gold-items'),
  getGoldItem: (id) => api.get(`/admin/gold-items/${id}`),
  createGoldItem: (data) => api.post('/admin/gold-items', data),
  updateGoldItem: (id, data) => api.put(`/admin/gold-items/${id}`, data),
  deleteGoldItem: (id) => api.delete(`/admin/gold-items/${id}`),

  getAvailableGoldItems: () => api.get('/admin/gold-items/available'),
  getPledgedGoldItems: () => api.get('/admin/gold-items/pledged'),
  getGoldItemDetails: (id) => api.get(`/admin/gold-items/${id}/details`),

  getAvailableGoldItemsByCustomer: (customerId) =>
    api.get(`/admin/gold-items/customer/${customerId}/available`),

  getPledgedGoldItemsByCustomer: (customerId) =>
    api.get(`/admin/gold-items/customer/${customerId}/pledged`),

  getAvailableGoldItemsForBank: () =>
    api.get('/admin/gold-items/available-for-bank'),

  getCustomerLoans: () => api.get('/admin/customer-loans'),
  getCustomerLoan: (id) => api.get(`/admin/customer-loans/${id}`),
  createCustomerLoan: (data) => api.post('/admin/customer-loans', data),

  processRepayment: (id, amount) =>
    api.post(`/admin/customer-loans/${id}/repayment?amount=${amount}`),

  getExpiredLoans: () => api.get('/admin/customer-loans/expired'),

  getLoansByCustomer: (customerId) =>
    api.get(`/admin/customer-loans/customer/${customerId}`),

  searchCustomerLoans: (serialNumber, searchTerm) =>
    api.get('/admin/customer-loans/search', { params: { serialNumber, searchTerm } }),

  getCustomerLoanBySerialNumber: (serialNumber) =>
    api.get(`/admin/customer-loans/serial/${serialNumber}`),

  createBulkCustomerLoans: (requests) =>
    api.post('/admin/customer-loans/bulk', requests),

  getPendingApprovalLoans: () => api.get('/admin/customer-loans/pending'),

  approveLoan: (loanId, data) =>
    api.post(`/admin/customer-loans/${loanId}/approve`, data),

  rejectLoan: (loanId, data) =>
    api.post(`/admin/customer-loans/${loanId}/reject`, data),

  getBankLoans: () => api.get('/admin/bank-loans'),
  getBankLoan: (id) => api.get(`/admin/bank-loans/${id}`),
  createBankLoan: (data) => api.post('/admin/bank-loans', data),

  processBankPayment: (id, amount) =>
    api.post(`/admin/bank-loans/${id}/payment?amount=${amount}`),

  searchBankLoans: (serialNumber, searchTerm) =>
    api.get('/admin/bank-loans/search', { params: { serialNumber, searchTerm } }),

  getBankLoanBySerialNumber: (serialNumber) =>
    api.get(`/admin/bank-loans/serial/${serialNumber}`),

  getBankLoansByCustomerLoan: (customerLoanId) =>
    api.get(`/admin/bank-loans/customer-loan/${customerLoanId}`),

  getBankLoanWithDetails: (id) =>
    api.get(`/admin/bank-loans/${id}/details`),

  getAdmins: () => api.get('/admin-management/admins'),

  addAdmin: (email) =>
    api.post(`/admin-management/admins/add?email=${encodeURIComponent(email)}`),

  removeAdmin: (email) =>
    api.delete(`/admin-management/admins/remove?email=${encodeURIComponent(email)}`),

  createUserWithRole: (data) =>
    api.post('/admin/users/create', data),

  updateUserRole: (id, data) =>
    api.put(`/admin/users/${id}`, data),

  getAllUsers: (role) =>
    api.get('/admin/users', { params: { role } }),

  getUserById: (id) =>
    api.get(`/admin/users/${id}`),

  deactivateUser: (id) =>
    api.patch(`/admin/users/${id}/deactivate`),

  activateUser: (id) =>
    api.patch(`/admin/users/${id}/activate`),

  checkPermission: (id, permission) =>
    api.get(`/admin/users/${id}/permissions/${permission}`),

  canApproveLoan: (id, amount, tenureMonths) =>
    api.get(`/admin/users/${id}/can-approve-loan`, { params: { amount, tenureMonths } }),

  getNotifications: () => api.get('/admin/notifications'),
  getUnreadNotificationCount: () => api.get('/admin/notifications/unread-count'),
  markNotificationAsRead: (id) => api.post(`/admin/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.post('/admin/notifications/read-all'),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  getDashboard: () => api.get('/user/dashboard'),
  getMyLoans: () => api.get('/user/my-loans'),
  getMyLoanById: (loanId) => api.get(`/user/my-loans/${loanId}`),
  getMyGoldItems: () => api.get('/user/my-gold-items'),
  getMyGoldItemById: (itemId) => api.get(`/user/my-gold-items/${itemId}`),
  changePassword: (data) => api.post('/user/change-password', data),

  getNotifications: () => api.get('/user/notifications'),
  getUnreadNotificationCount: () => api.get('/user/notifications/unread-count'),

  markNotificationAsRead: (id) =>
    api.post(`/user/notifications/${id}/read`),

  markAllNotificationsAsRead: () =>
    api.post('/user/notifications/read-all'),

  getUserSummary: () => api.get('/user/summary'),

  requestLoan: (loanData) =>
    api.post('/user/request-loan', loanData),

  getMyPendingLoans: () =>
    api.get('/user/my-pending-loans'),
};

export default api;