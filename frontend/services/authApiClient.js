import axios from "axios";

// Create dedicated auth API client for login/logout endpoints
// These endpoints don't use the /api prefix according to Swagger documentation
const authApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://172.22.80.212:8081",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper functions for auth endpoints
export const authApi = {
  post: (url, data = {}, config = {}) => {
    console.log('🚀 authApi.post called with:', { url, data, baseURL: authApiClient.defaults.baseURL });
    return authApiClient.post(url, data, config);
  },
};

export default authApiClient;