import { CaseT } from "../types";
import { request } from "./client";

export type CreateCaseInput = Omit<CaseT, "id">;
export type RemoteCase = CaseT & { id: string; title: string };

export const createCase = (officeId: string, form: CreateCaseInput) =>
  request<CaseT>(`/api/offices/${officeId}/cases`, {
    method: "POST",
    body: JSON.stringify(form),
  });
export const getOfficeCases = (officeId: string) =>
  request<RemoteCase[]>(`/api/offices/${officeId}/cases`);
export const getCaseDetails = (officeId: string, caseId: string) =>
  request<CaseT>(`/api/offices/${officeId}/cases/${caseId}`);
export const updateCase = (
  officeId: string,
  caseId: string,
  form: Partial<CaseT>,
) =>
  request<CaseT>(`/api/offices/${officeId}/cases/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify(form),
  });
export const assignLawyerToCase = (
  officeId: string,
  caseId: string,
  lawyerId: string | null,
) =>
  request<void>(`/api/offices/${officeId}/cases/${caseId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ id: lawyerId }),
  });
export const deleteCase = (officeId: string, caseId: string) =>
  request<void>(`/api/offices/${officeId}/cases/${caseId}`, {
    method: "DELETE",
  });
