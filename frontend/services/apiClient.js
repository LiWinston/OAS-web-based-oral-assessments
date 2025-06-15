import axios from "axios";
import useAuthStore from "../store/authStore";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from auth store
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;

    // Handle different error scenarios
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          useAuthStore.getState().logout();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          break;
        case 403:
          // Forbidden - user doesn't have permission
          console.error("Access forbidden:", response.data?.message);
          break;
        case 404:
          // Not found
          console.error("Resource not found:", response.data?.message);
          break;
        case 422:
          // Validation error
          console.error("Validation error:", response.data?.errors);
          break;
        case 500:
          // Server error
          console.error("Server error:", response.data?.message);
          break;
        default:
          console.error(
            "API Error:",
            response.data?.message || "Unknown error"
          );
      }
    } else if (error.request) {
      // Network error
      console.error("Network error:", error.message);
    } else {
      // Other error
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Helper functions for common HTTP methods
export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
};

// Helper for file uploads
export const uploadFile = (url, file, onProgress = null) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: onProgress
      ? (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      : undefined,
  });
};

export default apiClient;
