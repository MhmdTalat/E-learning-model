import axios, { AxiosInstance, AxiosError } from "axios";

interface CustomError extends Error {
  response?: AxiosError['response'];
}

// Prefer explicit Vite env var, fall back to common backend launch URL
const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_URL) || process.env.REACT_APP_API_URL || "http://localhost:52103";

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let axios set multipart/form-data with boundary when body is FormData
  if (config.data instanceof FormData && config.headers) {
    delete (config.headers as Record<string, unknown>)['Content-Type'];
  }
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
    hasToken: !!token,
  });
  return config;
});

console.log('[API client] Using base URL:', API_BASE_URL);

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => {
    console.log(`[API] ✓ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
    });
    return response;
  },
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const data = error.response?.data;
    const status = error.response?.status;
    
    console.error(`[API] ✗ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: status,
      message: data?.message ?? data?.error ?? error.message,
    });
    if (data && Object.keys(data).length > 0) {
      console.error('[API] Response body:', data);
    }
    
    // Enhanced error handling for different status codes
    if (status === 401) {
      console.error("Unauthorized - Invalid credentials or expired token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Create a more user-friendly error message
      const errorMessage = data?.message || "Your session has expired or credentials are invalid. Please log in again.";
      const customError = new Error(errorMessage) as CustomError;
      customError.response = error.response;
      return Promise.reject(customError);
    }
    
    if (status === 403) {
      const errorMessage = data?.message || "You don't have permission to access this resource";
      const customError = new Error(errorMessage) as CustomError;
      customError.response = error.response;
      return Promise.reject(customError);
    }
    
    if (status === 400) {
      const errorMessage = data?.message || data?.error || "Invalid request";
      const customError = new Error(errorMessage) as CustomError;
      customError.response = error.response;
      return Promise.reject(customError);
    }
    
    if (status === 404) {
      const errorMessage = data?.message || "Resource not found";
      const customError = new Error(errorMessage) as CustomError;
      customError.response = error.response;
      return Promise.reject(customError);
    }
    
    if (status === 500) {
      const errorMessage = data?.message || "Server error. Please try again later";
      const customError = new Error(errorMessage) as CustomError;
      customError.response = error.response;
      return Promise.reject(customError);
    }
    
    return Promise.reject(error);
  }
);

export const apiRequest = client;
export default client;
