import axios, { type AxiosResponse } from "axios";

const API_PORT = import.meta.env.VITE_API_PORT || "5000";
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `http://localhost:${API_PORT}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Check for teacher token first, then general token
  const teacherToken = localStorage.getItem("teacherToken");
  const generalToken = localStorage.getItem("token");
  const token = teacherToken || generalToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // If the request contains FormData, set the correct content type
  if (config.data instanceof FormData) {
    config.headers["Content-Type"] = "multipart/form-data";
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear both tokens and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("teacherToken");
      localStorage.removeItem("teacherData");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Function to set auth token manually
export const setAuthToken = (token: string | null): void => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
