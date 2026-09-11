import axios from "axios";
import { authStorage } from "./authStorage";
import { Logout } from "./Logout";

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY ?? "",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const tokens = await authStorage.getTokens();
      const accessToken = tokens?.accessToken;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.log("Failed to retrieve AccessToken", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
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

// 3. Intercept 401 Responses and Auto-Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/api/auth")) {
      Logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const tokens = await authStorage.getTokens();
      console.log(`[Tokens]: ${tokens.accessToken} /// ${tokens.refreshToken}`)
      if (!tokens?.refreshToken) {
        throw new Error("No refresh token available");
      }

    const res = await axios.post(
  `${BASE_URL}/api/auth/refresh`,
  { refreshToken: tokens.refreshToken }, // <--- Send in the body
  {
    headers: {
      "x-api-key": process.env.EXPO_PUBLIC_API_KEY,
      "x-client-type": "mobile",
    },
  }
);
      console.log(`[Refresh Response:] ${res.data}`)
      const responseData = res.data?.data || res.data;
      const newAccessToken = responseData.accessToken;
      const newRefreshToken = responseData.newRefreshToken;

      if (!newAccessToken || !newRefreshToken) {
        throw new Error("Invalid token payload received from refresh endpoint");
      }

      await authStorage.saveTokens(newAccessToken, newRefreshToken);

      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      Logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;