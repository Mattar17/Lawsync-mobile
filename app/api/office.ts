import { jwtDecode, JwtPayload } from "jwt-decode";
import { authStorage } from "../utils/authStorage";
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

export type OfficeResponse = {
  office:Office;
  success:boolean
}

export const getActiveOffice = async () => {
  const offices = await getMyOffices();
  console.log("Getting Acive Office",offices[0])
  return offices[0] ?? null;
};
export const getMyOffices = async() : Promise<Office[]> => {
  const memberships = await request<{ offices: Office[] }[]>("/api/offices/me");
  console.log(memberships);
  return memberships.flatMap((membership) => membership.offices ?? [])
};

export const getOffice = (officeId: string) =>
  request<OfficeResponse>(`/api/offices/${officeId}`);

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
  const {accessToken} = await authStorage.getTokens();
  if (!accessToken) {
    throw new Error("Authentication token not found");
  }

  const decoded = jwtDecode(accessToken) as MyJwtPayload;
  const lawyerId = decoded.lawyer_id;

  if (!lawyerId) {
    throw new Error("User ID not found in authentication token");
  }

  return request<Office>("/api/offices", {
    method: "POST",
    body: JSON.stringify({ name: data.name, owner_id: lawyerId }),
  });
};
