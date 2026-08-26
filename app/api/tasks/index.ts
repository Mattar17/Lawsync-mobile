import { request } from "../client";

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

export const getOfficeTasks = (officeId: string) =>
  request<Task[]>(`/api/offices/${officeId}/tasks`);
export const getTaskDetails = (officeId: string, taskId: string) =>
  request<Task>(`/api/offices/${officeId}/tasks/${taskId}`);
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
export const assignLawyerToTask = (
  officeId: string,
  taskId: string,
  lawyerId: string | null,
) =>
  request<void>(`/api/offices/${officeId}/tasks/${taskId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ id: lawyerId }),
  });
export const deleteTask = (officeId: string, taskId: string) =>
  request<void>(`/api/offices/${officeId}/tasks/${taskId}`, {
    method: "DELETE",
  });
