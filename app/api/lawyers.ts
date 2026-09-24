import { request, uploadRequest } from "./client";

export const getAllLawyersAdmin = () =>
  request<unknown[]>("/api/lawyers/admin");
export const getAllLawyersPublic = () => request<unknown[]>("/api/lawyers");
export const getLawyerById = (lawyerId: string) =>
  request<unknown>(`/api/lawyers/id/${lawyerId}`);
export const createLawyer = (body: object) =>
  request<unknown>("/api/lawyers", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateLawyerInfo = (lawyerId: string, body: object) =>
  request<unknown>(`/api/lawyers/${lawyerId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
export const updatePortalPassword = (lawyerId: string, body: object) =>
  request<unknown>(`/api/lawyers/${lawyerId}/update-portal-password`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateProfilePassword = (lawyerId: string, body: object) =>
  request<unknown>(`/api/lawyers/${lawyerId}/update-profile-password`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateLawyerAvatar = (lawyerId: string, formData: FormData) =>
  uploadRequest(`/api/lawyers/avatar/${lawyerId}`, formData);
export const deleteLawyer = (lawyerId: string) =>
  request<void>(`/api/lawyers/${lawyerId}`, { method: "DELETE" });

export type VerificationResponse = {
  success: boolean;
  message: string;
};

export const sendVerificationRequest = (
  data: FormData | { uri: string; name?: string; type?: string },
) => {
  let formData: FormData;
  if (data instanceof FormData) {
    formData = data;
  } else {
    formData = new FormData();
    formData.append("file", {
      uri: data.uri,
      name: data.name || "lawyer_card.jpg",
      type: data.type || "image/jpeg",
    } as unknown as Blob);
  }
  return uploadRequest<VerificationResponse>(
    "/api/lawyers/verification_request",
    formData,
  );
};

export const getVerificationStatus = () =>
  request<{ hasPendingRequest: boolean }>("/api/lawyers/verification_status");


