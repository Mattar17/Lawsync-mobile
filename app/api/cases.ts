import { CaseT, ClientType } from "../types";
import { request } from "./client";

export type CreateCaseInput = {
  case_number: string;
  case_year: string;
  client_name: string;
  client_opponent_name: string;
  title?: string | null;
  client_national_id?: string | null;
  client_opponent_national_id?: string | null;
  client_role?: string | null;
  assigned_lawyer_id?: string | null;
  case_degree?: string | null;
  case_type?: string | null;
  client_type?: ClientType | null;
  closed_at?: string | null;
  court_circuit?: string | null;
  court_name?: string | null;
  description?: string | null;
  latest_court_session_date?: string | null;
  latest_update?: string | null;
  next_court_session_date?: string | null;
  opened_at?: string | null;
};

export type RemoteCase = CaseT & { id: string };

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
