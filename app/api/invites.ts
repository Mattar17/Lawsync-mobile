import { request } from "./client";

export type InviteRole = "member" | "admin";
export type InviteStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";
export type Invite = {
  id: string;
  office_id: string;
  email: string;
  role: InviteRole;
  status: InviteStatus | string;
  expires_at?: string;
};

export const getOfficeInvites = (officeId: string) =>
  request<Invite[]>(`/api/offices/${officeId}/invites`);
export const createInvite = (
  officeId: string,
  form: { email: string; role: InviteRole },
) =>
  request<Invite>(`/api/offices/${officeId}/invites`, {
    method: "POST",
    body: JSON.stringify(form),
  });
export const cancelInvite = (inviteId: string) =>
  request<void>(`/api/invites/${inviteId}`, { method: "DELETE" });
export const getMyInvites = () => request<Invite[]>("/api/invites/me");
export const respondToInvite = (
  inviteId: string,
  action: "accepted" | "declined",
) =>
  request<Invite>(`/api/invites/${inviteId}/respond`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
