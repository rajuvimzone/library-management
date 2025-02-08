import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token
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

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me')
};

// Books API
export const books = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  create: (bookData) => api.post('/books', bookData),
  update: (id, bookData) => api.put(`/books/${id}`, bookData),
  delete: (id) => api.delete(`/books/${id}`),
  getByBarcode: (barcode) => api.get(`/books/barcode/${barcode}`)
};

// Transactions API
export const transactions = {
  getAll: (params) => api.get('/transactions', { params }),
  getUserTransactions: (params) => api.get('/transactions/my-transactions', { params }),
  issueBook: (data) => api.post('/transactions/issue', data),
  returnBook: (data) => api.post('/transactions/return', data)
};

// Users API (admin only)
export const users = {
  getAll: () => api.get('/auth/users'),
  create: (userData) => api.post('/auth/users', userData),
  update: (id, userData) => api.put(`/auth/users/${id}`, userData),
  delete: (id) => api.delete(`/auth/users/${id}`),
  updateStatus: (id, status) => api.patch(`/auth/users/${id}/status`, status)
};

export default {
  auth,
  books,
  transactions,
  users
};
