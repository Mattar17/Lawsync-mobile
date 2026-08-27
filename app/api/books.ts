import { request } from "./client";

export type BookCategory = { id: string; name: string; created_at?: string };
export type Book = {
  id: string;
  category_id?: string;
  title: string;
  description?: string | null;
  file_ext?: string;
};

export const getAllCategories = () =>
  request<BookCategory[]>("/api/books/category");
export const getAllBooksInCategory = (categoryId: string) =>
  request<Book[]>(`/api/books/category/${categoryId}`);
export const getFileUrl = (bookId: string) =>
  request<{ url: string }>(`/api/books/${bookId}`);
export const createCategory = (form: { name: string }) =>
  request<BookCategory>("/api/books/category", {
    method: "POST",
    body: JSON.stringify(form),
  });
export const deleteCategory = (categoryId: string) =>
  request<void>(`/api/books/category/${categoryId}`, { method: "DELETE" });
export const deleteBook = (bookId: string) =>
  request<void>(`/api/books/${bookId}`, { method: "DELETE" });
export const updateBookInfo = (
  bookId: string,
  form: { title?: string; categoryId?: string; description?: string },
) =>
  request<Book>(`/api/books/${bookId}`, {
    method: "PATCH",
    body: JSON.stringify(form),
  });
