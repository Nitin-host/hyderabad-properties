import axios from "axios";
import { notifyError } from "../util/Notifications";

const rawBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const baseURL = rawBase.endsWith("/api")
  ? rawBase
  : `${rawBase.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

const isRefreshUrl = (url = "") => String(url).includes("/auth/refresh-token");

const setAuthHeader = (headers, token) => {
  if (!headers) return { Authorization: `Bearer ${token}` };
  if (typeof headers.set === "function") {
    headers.set("Authorization", `Bearer ${token}`);
    return headers;
  }
  headers.Authorization = `Bearer ${token}`;
  return headers;
};

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await axios.post(
    `${baseURL}/auth/refresh-token`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );
  const payload = res.data;
  if (!payload?.success || !payload?.data?.token) {
    throw new Error(payload?.message || "Refresh failed");
  }

  localStorage.setItem("authToken", payload.data.token);
  if (payload.data.refreshToken) {
    localStorage.setItem("refreshToken", payload.data.refreshToken);
  }
  return payload.data.token;
}

function queueRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function clearSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.dispatchEvent(new CustomEvent("auth:session-expired"));
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token && !isRefreshUrl(config.url)) {
      config.headers = setAuthHeader(config.headers, token);
    }
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (typeof config.headers?.setContentType === "function") {
        config.headers.setContentType(false);
      } else if (config.headers) {
        delete config.headers["Content-Type"];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.code === "ERR_CANCELED" || error.name === "CanceledError") {
      return Promise.reject(error);
    }

    const original = error.config;
    const status = error.response?.status;
    const url = String(original?.url || "");
    const skipToast = original?.skipErrorToast;
    const isAuthPublic =
      /\/auth\/(login|register|logout|refresh-token|verify-admin-otp|forgot-password|verify-forgot-otp|reset-password)/.test(
        url
      );

    if (status === 401 && original && !original._retry && !isRefreshUrl(url)) {
      original._retry = true;
      try {
        const token = await queueRefresh();
        original.headers = setAuthHeader(original.headers, token);
        return api(original);
      } catch {
        clearSession();
        if (!skipToast && !isAuthPublic) {
          notifyError("Session expired. Please log in again.");
        }
        return Promise.reject({
          status: 401,
          message: "Session expired. Please log in again.",
          data: error.response?.data || null,
        });
      }
    }

    if (error.response) {
      const { data } = error.response;
      if (status === 403 && !skipToast) {
        notifyError("You do not have permission to access this resource.");
      } else if (status === 404 && !skipToast && !url.includes("/video/")) {
        notifyError("The requested resource was not found.");
      } else if (status === 500 && !skipToast && !url.includes("/video/part")) {
        notifyError("An internal server error occurred.");
      }

      return Promise.reject({
        status,
        message: data?.message || "An error occurred",
        data,
      });
    }

    if (error.request) {
      return Promise.reject({
        status: 0,
        message: "Network error. Please check your connection.",
        data: null,
      });
    }

    if (!skipToast) notifyError(error.message);
    return Promise.reject({
      status: 0,
      message: error.message,
      data: null,
    });
  }
);

export const authAPI = {
  login: (credentials) =>
    api.post("/auth/login", credentials, { skipErrorToast: true }),
  verifyAdminOtp: (userData) =>
    api.post("/auth/verify-admin-otp", userData, { skipErrorToast: true }),
  forgotPassword: (email) =>
    api.post("/auth/forgot-password", email, { skipErrorToast: true }),
  verifyForgotOtp: (data) =>
    api.post("/auth/verify-forgot-otp", data, { skipErrorToast: true }),
  register: (userData) =>
    api.post("/auth/register", userData, { skipErrorToast: true }),
  resetPassword: (data) =>
    api.post("/auth/reset-password", data, { skipErrorToast: true }),
  logout: () => api.post("/auth/logout", {}, { skipErrorToast: true }),
  refreshToken: (refreshToken) =>
    api.post(
      "/auth/refresh-token",
      { refreshToken },
      { skipErrorToast: true }
    ),
  getProfile: (config = {}) => api.get("/auth/profile", config),
  updateProfile: (data) => {
    return api.put("/auth/profile", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getFavorites: () => api.get("/auth/favorites"),
  addToFavorites: (propertyId) => api.post(`/auth/favorites/${propertyId}`),
  removeFromFavorites: (propertyId) =>
    api.delete(`/auth/favorites/${propertyId}`),
  createAdmin: (userData) => api.post("/auth/admin/create", userData),
  updateAdmin: (id, userData) => api.put(`/auth/admin/${id}`, userData),
  deleteAdmin: (id) => api.delete(`/auth/admin/${id}`),
  getAdmins: () => api.get("/auth/admins"),
};

export const propertiesAPI = {
  getAll: (params, config = {}) => api.get("/properties", { params, ...config }),
  getById: (id, config = {}) => api.get(`/properties/${id}`, config),
  getSlug: (slug, config = {}) => api.get(`/properties/slug/${slug}`, config),
  getAdminAll: (params) => api.get("/properties/admin", { params }),
  createProperty: (data) => api.post("/properties", data),
  updateProperty: (id, data) => {
    return api.put(`/properties/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  checkVideoStatus: (propertyId) =>
    api.get(`/properties/${propertyId}/video/status`),
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
  initVideoUpload: (propertyId, data) =>
    api.post(`/properties/${propertyId}/video/initiate`, data),
  uploadVideoPart: (propertyId, formData) =>
    api.put(`/properties/${propertyId}/video/part`, formData, {
      timeout: 180000,
    }),
  completeVideoUpload: (propertyId, data) =>
    api.post(`/properties/${propertyId}/video/complete`, data, {
      timeout: 180000,
    }),
  abortVideoUpload: (propertyId, data) =>
    api.post(`/properties/${propertyId}/video/abort`, data),
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
  createAdmin: (userData) => api.post("/auth/admin/create", userData),
  getAdmins: (params) => api.get("/auth", { params }),
  updateUserRole: (id, role) => api.put(`/auth/${id}/role`, { role }),
};

export const apiMethods = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  patch: (url, data, config) => api.patch(url, data, config),
  delete: (url, config) => api.delete(url, config),
};

export default api;
