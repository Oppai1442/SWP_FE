import axios from "axios";

const DEFAULT_TIMEOUT = 10000;
const LONG_RUNNING_ENDPOINTS = [/\/testing-requests\/details$/, /\/transaction\/admin/];
const LONG_TIMEOUT = 60000;

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim() || "/api",
  timeout: DEFAULT_TIMEOUT,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accountToken");

    if (token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.url && LONG_RUNNING_ENDPOINTS.some((pattern) => pattern.test(config.url!))) {
      config.timeout = LONG_TIMEOUT;
    }

    if (config.data instanceof FormData) {
      config.timeout = Math.max(DEFAULT_TIMEOUT, 30000);
    } else if (config.headers) {
      config.headers["Content-Type"] = config.headers["Content-Type"] ?? "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem("accountToken");
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      } catch (storageError) {
        console.warn("Failed to clear auth token", storageError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
