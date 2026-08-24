import axios, { AxiosError, type AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

const defaultServerUrl = process.env.INTERNAL_API_URL ?? "http://backend:8000/api/v1";
const defaultClientUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ─── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
  timeout: 60000, // 60 seconds — AI operations and large dataset queries need more time
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor — Attach JWT Token ────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const isNode = typeof window === "undefined";
    config.baseURL = isNode ? defaultServerUrl : defaultClientUrl;

    if (!isNode) {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Inject workspace ID
      const activeWs = useWorkspaceStore.getState().activeWs;
      if (activeWs?.id) {
        config.headers["x-workspace-id"] = activeWs.id;
      }
    }

    // Allow browser to set Content-Type with boundary for FormData
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Deduplicate toasts — prevent same error from stacking multiple times
const activeToasts = new Set<string>();
function showToastOnce(type: "error" | "warning", message: string) {
  if (activeToasts.has(message)) return;
  activeToasts.add(message);
  const fn = type === "error" ? toast.error : toast.warning;
  fn(message, {
    onDismiss: () => activeToasts.delete(message),
    onAutoClose: () => activeToasts.delete(message),
  });
}

// ─── Refresh Token Queue for Concurrency ──────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ─── Response Interceptor — Global Error Handling & Refresh Token Rotation ────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ message?: string; code?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const message = error.response?.data?.message;

    // Handle 401 Unauthorized with Refresh Token Rotation (RTR)
    if (status === 401 && originalRequest && !originalRequest._retry) {
      // Do not attempt refresh on login or token refresh endpoints themselves
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/mfa/verify")
      ) {
        return Promise.reject(error);
      }

      if (typeof window !== "undefined") {
        const storedRefreshToken = localStorage.getItem("refresh_token");

        if (storedRefreshToken) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const baseURL = defaultClientUrl;
            const res = await axios.post<{
              access_token: string;
              refresh_token: string;
            }>(`${baseURL}/auth/refresh`, {
              refresh_token: storedRefreshToken,
            });

            const { access_token, refresh_token } = res.data;
            useAuthStore.getState().setTokens(access_token, refresh_token);

            api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
            processQueue(null, access_token);

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          } catch (refreshErr) {
            processQueue(refreshErr, null);
            useAuthStore.getState().logout();
            showToastOnce("error", "Your session has expired. Please log in again.");
            return Promise.reject(refreshErr);
          } finally {
            isRefreshing = false;
          }
        }
      }

      // No refresh token available
      useAuthStore.getState().logout();
      showToastOnce("error", "Your session has expired. Please log in again.");
      return Promise.reject(error);
    }

    switch (status) {
      case 403:
        // Suppress 403 toasts for viewer-specific endpoints — non-viewer roles degrade silently
        if (!originalRequest.url?.includes("/viewer/")) {
          showToastOnce("error", message ?? "You do not have permission to perform this action.");
        }
        break;

      case 402:
        showToastOnce("error", message ?? "You have reached your plan limit. Please upgrade.");
        break;

      case 429:
        showToastOnce("warning", message ?? "Too many requests. Please wait a moment and try again.");
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        showToastOnce("error", "We are experiencing technical difficulties. Please try again shortly.");
        break;

      default:
        if (!error.response && !originalRequest.url?.includes("/viewer/")) {
          showToastOnce("error", "Network error. Please check your internet connection.");
        }
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
