import axios from "axios";
import useAuthStore from "../store/authStore";

/**
 * API Client Configuration
 * 
 * Centralized Axios instance for all API communications.
 * Handles authentication, error responses, and provides a consistent
 * interface for making HTTP requests throughout the application.
 */

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api", // Points to Spring Boot backend
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for CORS with credentials
});

/**
 * Request Interceptor
 * 
 * Automatically attaches JWT token to all outgoing requests.
 * Token is retrieved from the auth store.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get access token from auth store
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 
 * Global error handling for all API responses.
 * Handles authentication errors, validation errors, and network issues.
 */
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
      // Network error - no response received
      console.error("Network error:", error.message);
    } else {
      // Other error - request setup failed
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * API Helper Methods
 * 
 * Convenience methods for common HTTP operations.
 * All methods automatically include authentication headers and error handling.
 */
export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
};

/**
 * File Upload Helper
 * 
 * Handles file uploads with progress tracking.
 * @param {string} url - Upload endpoint
 * @param {File} file - File to upload
 * @param {Function} onProgress - Progress callback (receives percentage)
 * @returns {Promise} Upload response
 */
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