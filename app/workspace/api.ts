import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

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
export type Invite = {
  id: string;
  office_id: string;
  email: string;
  role: "member" | "admin";
  status: string;
  expires_at?: string;
};
export type Task = {
  id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  due_date?: string | null;
  status: string;
  case_id?: string | null;
  assigned_lawyer_id?: string | null;
};
export type RemoteCase = {
  id: string;
  title: string;
  case_number: string;
  case_year: string;
  client_name: string;
  case_status: string;
  next_court_session_date?: string | null;
};

async function headers() {
  const token = await SecureStore.getItemAsync("jwt");
  return {
    "Content-Type": "application/json",
    "x-api-key": API_KEY!,
    Authorization: `Bearer ${token ?? ""}`,
  };
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...(await headers()), ...(options.headers ?? {}) },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "تعذر تنفيذ الطلب");
  return body.data ?? body;
}

export async function getActiveOffice() {
  const result = await request<{ offices: Office }[]>(`/api/offices/me`);
  return result[0]?.offices ?? null;
}

export const getTasks = (officeId: string) =>
  request<Task[]>(`/api/offices/${officeId}/tasks`);
export const createTask = (officeId: string, body: object) =>
  request<Task>(`/api/offices/${officeId}/tasks`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateTask = (officeId: string, taskId: string, body: object) =>
  request<Task>(`/api/offices/${officeId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const deleteTask = (officeId: string, taskId: string) =>
  request<void>(`/api/offices/${officeId}/tasks/${taskId}`, {
    method: "DELETE",
  });
export const getCases = (officeId: string) =>
  request<RemoteCase[]>(`/api/offices/${officeId}/cases`);
export const getMembers = (officeId: string) =>
  request<Member[]>(`/api/offices/${officeId}/members`);
export const removeMember = (officeId: string, memberId: string) =>
  request<void>(`/api/offices/${officeId}/members/${memberId}`, {
    method: "DELETE",
  });
export const getOfficeInvites = (officeId: string) =>
  request<Invite[]>(`/api/offices/${officeId}/invites`);
export const createInvite = (officeId: string, body: object) =>
  request<Invite>(`/api/offices/${officeId}/invites`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const cancelInvite = (inviteId: string) =>
  request<void>(`/api/invites/${inviteId}`, { method: "DELETE" });
export const getOffice = (officeId: string) =>
  request<Office>(`/api/offices/${officeId}`);
export const updateOffice = (officeId: string, body: object) =>
  request<Office>(`/api/offices/${officeId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
