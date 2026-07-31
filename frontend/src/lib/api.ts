import axios, { AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

const isServer = typeof window === "undefined";
const defaultServerUrl = process.env.INTERNAL_API_URL ?? "http://backend:8000/api/v1";
const defaultClientUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ─── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
  timeout: 30000, // 30 seconds — AI operations may take longer
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor — Attach JWT Token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const isNode = typeof window === "undefined";
    config.baseURL = isNode ? defaultServerUrl : defaultClientUrl;

    if (!isNode) {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Global Error Handling ─────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ message?: string; code?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    switch (status) {
      case 401: {
        // Session expired — wipe auth state and redirect to login
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        toast.error("Your session has expired. Please log in again.");
        break;
      }

      case 403:
        toast.error(
          message ?? "You do not have permission to perform this action."
        );
        break;

      case 402:
        toast.error(
          message ?? "You have reached your plan limit. Please upgrade."
        );
        break;

      case 429:
        toast.warning(
          message ?? "Too many requests. Please wait a moment and try again."
        );
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        toast.error(
          "We are experiencing technical difficulties. Please try again shortly."
        );
        break;

      default:
        if (!error.response) {
          // Network error — user is offline or backend is unreachable
          toast.error(
            "Unable to reach the server. Please check your internet connection."
          );
        }
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
