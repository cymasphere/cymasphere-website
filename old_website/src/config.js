// Frontend configuration constants

// API configuration
export const API_BASE_URL = "http://localhost:8000/api";

// Authentication configuration
export const AUTH_TOKEN_NAME = "cymasphere_auth_token";
export const USER_DATA_NAME = "cymasphere_user_data";

// Application settings
export const APP_NAME = "Cymasphere";
export const APP_VERSION = "1.0.0";

// Feature flags
export const FEATURES = {
  enableSubscriptions: true,
  enableNotifications: true,
  enableDarkMode: true
};

// Export all configuration
export default {
  API_BASE_URL,
  AUTH_TOKEN_NAME,
  USER_DATA_NAME,
  APP_NAME,
  APP_VERSION,
  FEATURES,
};
