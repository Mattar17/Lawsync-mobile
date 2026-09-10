import axios, { type AxiosRequestConfig, type Method } from "axios";
import { authStorage } from "../utils/authStorage";
import apiClient from "../utils/refreshToken";

console.log(process.env.EXPO_PUBLIC_API_URL)
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

apiClient.interceptors.request.use(
  async (config) => {
    const { accessToken } = await authStorage.getTokens();
    console.log("[access token:]",accessToken)
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const publicApiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "x-client-type": "mobile",
    "Content-Type": "application/json",
    "x-api-key": API_KEY ?? "",
  },
});

export interface CustomRequestOptions extends AxiosRequestConfig {
  body?: any;
}

export interface PublicResponse<T> {
  response: {
    ok: boolean;
    status: number;
    headers: any;
  };
  body: T;
}

export async function request<T>(
  path: string,
  options: CustomRequestOptions = {},
): Promise<T> {
  const { body, data, method = "GET", headers, ...restOptions } = options;

  let requestData = data ?? body;
  if (typeof requestData === "string") {
    try {
      requestData = JSON.parse(requestData);
    } catch {
      // keep as string if not valid JSON
    }
  }

  try {
    const response = await apiClient.request<any>({
      url: path,
      method: (method as Method) || "GET",
      data: requestData,
      headers,
      ...restOptions,
    });

    console.log("Request to:", path, "Response:", response.status, response.data);
    return (response.data?.data ?? response.data) as T;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      console.log("Request error to:", path, "Status:", status, responseData);

      const errorMessage =
        responseData?.message ||
        (status ? `خطأ في الخادم (${status})` : "تعذر تنفيذ الطلب");

      throw new Error(errorMessage);
    }

    throw error;
  }
}

export async function uploadRequest<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  try {
    const response = await apiClient.post<any>(path, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return (response.data?.data ?? response.data) as T;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || "تعذر رفع الصورة";
      throw new Error(errorMessage);
    }
    throw new Error(error?.message || "تعذر رفع الصورة");
  }
}

export async function publicRequest<T>(
  path: string,
  options: CustomRequestOptions = {},
): Promise<PublicResponse<T>> {
  const { body, data, method = "GET", headers, ...restOptions } = options;

  let requestData = data ?? body;
  if (typeof requestData === "string") {
    try {
      requestData = JSON.parse(requestData);
    } catch {
      console.log("error here in catch")
    }
  }

  try {
    const response = await publicApiClient.request<T>({
      url: path,
      method: (method as Method) || "GET",
      data: requestData,
      headers,
      validateStatus: () => true, // Don't throw on error status codes so caller can check res.ok
      ...restOptions,
    });

    console.log("Raw Login Response Body:", response.data);
    console.log("Raw Response Headers:", response.headers);

    return {
      response: {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        headers: response.headers,
      },
      body: response.data,
    };
  } catch (error: any) {
  console.error("Public request network error:", {
    message: error.message,
    code: error.code, 
    url: error.config?.baseURL + (error.config?.url || ""),
  });
  throw error;
}
}
