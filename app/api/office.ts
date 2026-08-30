import * as SecureStore from "expo-secure-store";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { request } from "./client";

interface MyJwtPayload extends JwtPayload {
  lawyer_id?: string;
}

export type OfficeRole = "admin" | "member";
export type Office = {
  id: string;
  name: string;
  owner_id: string;
  address?: string;
  phone?: string;
  description?: string;
};
export type Member = {
  id: string;
  name: string;
  email: string;
  picture_url?: string;
  role: "owner" | "member";
};

export const getActiveOffice = async () => {
  const offices = await getMyOffices();
  return offices[0] ?? null;
};
export const getMyOffices = async () => {
  const memberships = await request<{ offices: Office }[]>("/api/offices/me");
  return memberships
    .map((membership) => membership.offices)
    .filter((office): office is Office => Boolean(office));
};
export const getOffice = (officeId: string) =>
  request<Office>(`/api/offices/${officeId}`);
export const updateOffice = (officeId: string, body: object) =>
  request<Office>(`/api/offices/${officeId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
export const leaveOffice = (officeId: string) =>
  request<void>(`/api/offices/${officeId}/leave`, { method: "POST" });
export const getMembers = (officeId: string) =>
  request<Member[]>(`/api/offices/${officeId}/members`);
export const removeMember = (officeId: string, memberId: string) =>
  request<void>(`/api/offices/${officeId}/members/${memberId}`, {
    method: "DELETE",
  });
export const createOffice = async (data: { name: string }) => {
  const jwt = await SecureStore.getItemAsync("jwt");
  if (!jwt) {
    throw new Error("Authentication token not found");
  }

  const decoded = jwtDecode(jwt) as MyJwtPayload;
  const lawyerId = decoded.lawyer_id;

  if (!lawyerId) {
    throw new Error("User ID not found in authentication token");
  }

  return request<Office>("/api/offices", {
    method: "POST",
    body: JSON.stringify({ name: data.name, owner_id: lawyerId }),
  });
};
