import { request, uploadRequest } from "./client";

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
  const parts: string[] = [];
  if (params?.status && params.status !== "all") {
    parts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params?.page) {
    parts.push(`page=${encodeURIComponent(String(params.page))}`);
  }
  if (params?.limit) {
    parts.push(`limit=${encodeURIComponent(String(params.limit))}`);
  }
  const queryString = parts.join("&");
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

export type SubscriptionRequestItem = {
  id: string;
  lawyer_id: string;
  invoice_path: string | null;
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

export const getAllSubscriptionRequests = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const parts: string[] = [];
  if (params?.status && params.status !== "all") {
    parts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params?.page) {
    parts.push(`page=${encodeURIComponent(String(params.page))}`);
  }
  if (params?.limit) {
    parts.push(`limit=${encodeURIComponent(String(params.limit))}`);
  }
  const queryString = parts.join("&");
  const path = `/api/admin/subscription_requests${queryString ? `?${queryString}` : ""}`;
  return request<SubscriptionRequestItem[]>(path);
};

export const getSubscriptionInvoiceUrl = (requestId: string) =>
  request<{ signedUrl: string; expiresIn: number }>(
    `/api/admin/subscription_requests/${requestId}`,
  );

export const answerSubscriptionRequest = (
  requestId: string,
  body:
    | { action: "accepted" }
    | { action: "rejected"; rejection_reason: string },
) =>
  request<{ request: any; is_subscribed?: boolean }>(
    `/api/admin/subscription_requests/${requestId}`,
    {
      method: "POST",
      data: body,
    },
  );

export type AdminTemplateItem = {
  id: string;
  title: string;
  raw_arabic_text?: string | null;
  handlebars_content?: string | null;
  placeholders: any[] | null;
  pdf_storage_path?: string | null;
  template_type?: string | null;
  is_app_template?: boolean;
  created_at: string;
};

export const getAdminAppTemplates = () =>
  request<AdminTemplateItem[]>("/api/admin/app-templates");

export const createAdminAppTemplate = (formData: FormData) =>
  uploadRequest<AdminTemplateItem>("/api/admin/app-templates", formData);

export const deleteAdminAppTemplate = (id: string) =>
  request<{ success: boolean; message: string }>(
    `/api/admin/app-templates/${id}`,
    {
      method: "DELETE",
    },
  );

