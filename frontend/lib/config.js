// Configuration for the application

// Use mock API for development (set to false when backend is ready)
export const USE_MOCK_API = true;

// API URL (will be used when USE_MOCK_API is false)
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Other configuration constants can be added here as needed