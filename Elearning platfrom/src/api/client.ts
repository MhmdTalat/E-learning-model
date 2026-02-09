import axios, { AxiosInstance, AxiosError } from "axios";

const API_BASE_URL = "http://localhost:5295";

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
    console.error(`[API] ✗ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      message: data?.message ?? data?.error ?? error.message,
    });
    if (data && Object.keys(data).length > 0) {
      console.error('[API] Response body:', data);
    }
    
    if (error.response?.status === 401) {
      console.error("Unauthorized - Token may be invalid or expired");
      localStorage.removeItem("token");
      // Optionally reload page to trigger login redirect
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiRequest = client;
export default client;
