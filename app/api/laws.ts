import { request } from "./client";

export type LawCategory = {
  id: number;
  name: string;
};

export type LawText = {
  id: number;
  category_id: number;
  article_number: string;
  content: string;
  law_categories?: {
    id: number;
    name: string;
  } | null;
};

// ─── Law Categories API ───────────────────────────────────────────────────────

export const getAllLawCategories = () =>
  request<LawCategory[]>("/api/laws/categories");

export const getLawCategoryById = (categoryId: number) =>
  request<LawCategory>(`/api/laws/categories/${categoryId}`);

export const createLawCategory = (form: { name: string }) =>
  request<LawCategory>("/api/laws/categories", {
    method: "POST",
    body: JSON.stringify(form),
  });

export const updateLawCategory = (categoryId: number, form: { name: string }) =>
  request<LawCategory>(`/api/laws/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(form),
  });

export const deleteLawCategory = (categoryId: number) =>
  request<void>(`/api/laws/categories/${categoryId}`, {
    method: "DELETE",
  });

// ─── Law Texts (مواد القانون) API ─────────────────────────────────────────────

export const getLawTextsByCategory = (categoryId: number) =>
  request<LawText[]>(`/api/laws/categories/${categoryId}/texts`);

export const getAllLawTexts = (params?: {
  categoryId?: number;
  search?: string;
}) => {
  const parts: string[] = [];
  if (params?.categoryId) {
    parts.push(`categoryId=${encodeURIComponent(String(params.categoryId))}`);
  }
  if (params?.search) {
    parts.push(`search=${encodeURIComponent(params.search)}`);
  }
  const qs = parts.join("&");
  return request<LawText[]>(`/api/laws/texts${qs ? `?${qs}` : ""}`);
};

export const createLawText = (form: {
  category_id: number;
  article_number: string;
  content: string;
}) =>
  request<LawText>("/api/laws/texts", {
    method: "POST",
    body: JSON.stringify(form),
  });

export const updateLawText = (
  textId: number,
  form: {
    article_number?: string;
    content?: string;
    category_id?: number;
  },
) =>
  request<LawText>(`/api/laws/texts/${textId}`, {
    method: "PATCH",
    body: JSON.stringify(form),
  });

export const deleteLawText = (textId: number) =>
  request<void>(`/api/laws/texts/${textId}`, {
    method: "DELETE",
  });

