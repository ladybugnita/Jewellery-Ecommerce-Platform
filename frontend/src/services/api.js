import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
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
  
  getCustomerLoans: () => api.get('/admin/customer-loans'),
  getCustomerLoan: (id) => api.get(`/admin/customer-loans/${id}`),
  createCustomerLoan: (data) => api.post('/admin/customer-loans', data),
  processRepayment: (id, amount) => api.post(`/admin/customer-loans/${id}/repayment?amount=${amount}`),
  getExpiredLoans: () => api.get('/admin/customer-loans/expired'),
  getLoansByCustomer: (customerId) => api.get(`/admin/customer-loans/customer/${customerId}`),
  
  getBankLoans: () => api.get('/admin/bank-loans'),
  getBankLoan: (id) => api.get(`/admin/bank-loans/${id}`),
  createBankLoan: (data) => api.post('/admin/bank-loans', data),
  processBankPayment: (id, amount) => api.post(`/admin/bank-loans/${id}/payment?amount=${amount}`),
  
  getAdmins: () => api.get('/admin-management/admins'),
  addAdmin: (email) => api.post(`/admin-management/admins/add?email=${encodeURIComponent(email)}`),
  removeAdmin: (email) => api.delete(`/admin-management/admins/remove?email=${encodeURIComponent(email)}`),
};

export default api;