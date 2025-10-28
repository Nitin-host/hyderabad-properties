import axios from 'axios';
import { notifyError } from '../util/Notifications';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Include cookies for cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or your auth context
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common responses
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle common error responses
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Don't automatically clear tokens here - let AuthContext handle it
          // This allows for proper refresh token logic
          console.log('401 Unauthorized - Token may be expired');
          notifyError('Session expired. Please log in again.');
          break;
        case 403:
          console.error('Access forbidden');
          notifyError('You do not have permission to access this resource.');
          break;
        case 404:
          console.error('Resource not found');
          notifyError('The requested resource was not found.');
          break;
        case 500:
          console.error('Server error');
          notifyError('An internal server error occurred.');
          break;
        default:
          console.error('API Error:', data?.message || 'Unknown error');
      }
      
      return Promise.reject({
        status,
        message: data?.message || 'An error occurred',
        data: data
      });
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
        data: null
      });
    } else {
      // Something else happened
      console.error('Error:', error.message);
      notifyError(error.message);
      return Promise.reject({
        status: 0,
        message: error.message,
        data: null
      });
    }
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  verifyAdminOtp: (userData)=> api.post('/auth/verify-admin-otp', userData),
  forgotPassword: (email) => api.post("/auth/forgot-password",  email ),
  verifyForgotOtp: (data) => api.post("/auth/verify-forgot-otp", data),
  register: (userData) => api.post("/auth/register", userData),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  logout: () => api.post("/auth/logout"),
  refreshToken: () => api.post("/auth/refresh"),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => {
   return api.put("/auth/profile", data, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getFavorites: () => api.get("/auth/favorites"),
  addToFavorites: (propertyId) => api.post(`/auth/favorites/${propertyId}`),
  removeFromFavorites: (propertyId) => api.delete(`/auth/favorites/${propertyId}`),
  // Admin user management
  createAdmin: (userData) => api.post("/auth/admin/create", userData),
  updateAdmin: (id, userData) => api.put(`/auth/admin/${id}`, userData),
  deleteAdmin: (id) => api.delete(`/auth/admin/${id}`),
  getAdmins: () => api.get("/auth/admins"),
};

export const propertiesAPI = {
  getAll: (params) => api.get("/properties", { params }),
  getById: (id) => api.get(`/properties/${id}`),
  getAdminAll: (params) => api.get("/properties/admin", { params }),
  createProperty: (data) => api.post("/properties", data),
  updateProperty: (id, data) => {
    return api.put(`/properties/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getDeleted: (params) => api.get("/properties/deleted", { params }),
  deleteProperty: (id) => api.delete(`/properties/${id}`),
  restoreProperty: (id) => api.put(`/properties/admin/${id}/restore`),
  permanentlyDeleteProperty: (id) =>
    api.delete(`/properties/admin/${id}/permanent`),
  uploadImages: (propertyId, formData) => {
    return api.post(`/properties/${propertyId}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadVideos: (propertyId, formData) => {
    return api.post(`/properties/${propertyId}/video`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteImage: (propertyId, imageId) =>
    api.delete(`/properties/${propertyId}/images/${imageId}`),
  deleteVideo: (propertyId, videoId) =>
    api.delete(`/properties/${propertyId}/videos/${videoId}`),
};

export const usersAPI = {
  getAll: (params) => api.get("/auth", { params }),
  getById: (id) => api.get(`/auth/${id}`),
  update: (id, data) => api.put(`/auth/${id}`, data),
  delete: (id) => api.delete(`/auth/${id}`),
  // Admin-specific endpoints
  createAdmin: (userData) => api.post("/auth/admin/create", userData),
  getAdmins: (params) => api.get("/auth", { params }),
  updateUserRole: (id, role) => api.put(`/auth/${id}/role`, { role }),
};

// Generic API methods for custom endpoints
export const apiMethods = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  patch: (url, data, config) => api.patch(url, data, config),
  delete: (url, config) => api.delete(url, config),
};

export default api;