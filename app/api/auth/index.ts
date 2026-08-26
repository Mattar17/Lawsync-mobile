import type { User } from "../../zustandStore/userStore";
import { publicRequest } from "../client";

export type AuthResponse = {
  success: boolean;
  message?: string;
  data?: { token: string; user: User };
};

export const login = (email: string, password: string) =>
  publicRequest<AuthResponse>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
export const register = (body: {
  name: string;
  email: string;
  password: string;
  phone: string;
}) =>
  publicRequest<AuthResponse>("/api/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
