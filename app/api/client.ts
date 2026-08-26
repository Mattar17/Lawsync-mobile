import * as SecureStore from "expo-secure-store";

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

async function getHeaders() {
  const token = await SecureStore.getItemAsync("jwt");
  return {
    "Content-Type": "application/json",
    "x-api-key": API_KEY ?? "",
    Authorization: `Bearer ${token ?? ""}`,
  };
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...(await getHeaders()), ...(options.headers ?? {}) },
  });
  const body = await response.json();
  console.log("Request to:", path, "Response:", response.status, body);
  if (!response.ok) throw new Error(body.message || "تعذر تنفيذ الطلب");
  return (body.data ?? body) as T;
}

export async function publicRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ response: Response; body: T }> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY ?? "",
      ...(options.headers ?? {}),
    },
  });
  return { response, body: (await response.json()) as T };
}
