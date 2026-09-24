import { request } from "./client";

export type VerificationRequestItem = {
  id: string;
  lawyer_id: string;
  lawyer_card_path: string | null;
  status: "pending" | "accepted" | "rejected" | "canceled";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  lawyers: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    bio: string | null;
    picture_url: string | null;
    is_verified: boolean;
    created_at: string;
  } | null;
};

export const getAllVerificationRequests = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") {
    query.append("status", params.status);
  }
  if (params?.page) {
    query.append("page", params.page.toString());
  }
  if (params?.limit) {
    query.append("limit", params.limit.toString());
  }
  const queryString = query.toString();
  const path = `/api/admin/verification_requests${queryString ? `?${queryString}` : ""}`;
  return request<VerificationRequestItem[]>(path);
};

export const getLawyerCardUrl = (requestId: string) =>
  request<{ signedUrl: string; expiresIn: number }>(
    `/api/admin/verification_requests/${requestId}`,
  );

export const answerVerificationRequest = (
  requestId: string,
  body:
    | { action: "accepted" }
    | { action: "rejected"; rejection_reason: string },
) =>
  request<{ request: any; is_verified: boolean }>(
    `/api/admin/verification_requests/${requestId}`,
    {
      method: "POST",
      data: body,
    },
  );
