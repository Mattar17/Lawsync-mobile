import type { User } from "../zustandStore/userStore";
import { publicRequest } from "./client";

export type AuthResponse = {
  success: boolean;
  message?: string;
  data?: { accessToken: string;refreshToken:string; user: User };
};

export const login = (email: string, password: string) =>
  publicRequest<AuthResponse>("/api/login", {
    method: "POST",
    data: { email, password },
  });

export const register = (body: {
  name: string;
  email: string;
  password: string;
  phone: string | null;
}) =>
  publicRequest<AuthResponse>("/api/register", {
    method: "POST",
    data: body,
  });

export type GeneralApiResponse = {
  success: boolean;
  message: string;
};

export const requestPasswordReset = (email: string) =>
  publicRequest<GeneralApiResponse>("/api/forgot-password", {
    method: "POST",
    data: { email },
  });

export const verifyResetOtp = (email: string, code: string) =>
  publicRequest<GeneralApiResponse>("/api/verify-otp", {
    method: "POST",
    data: { email, code },
  });

export const resetPassword = (data: {
  email: string;
  code: string;
  newPassword: string;
}) =>
  publicRequest<GeneralApiResponse>("/api/reset-password", {
    method: "POST",
    data,
  });

