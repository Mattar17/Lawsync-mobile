import { request, uploadRequest } from "./client";

export type PlaceholderItem =
  | string
  | {
      key: string;
      label?: string;
      type?: string;
    };

export type LegalTemplate = {
  id: string;
  title: string;
  raw_arabic_text?: string;
  handlebars_content?: string;
  placeholders: PlaceholderItem[] | null;
  template_type?: string;
  is_app_template?: boolean;
  category?: string;
  created_at: string;
};

export type TemplatesResponse = {
  myTemplates: LegalTemplate[];
  appTemplates: LegalTemplate[];
};

export type GenerateDocumentResponse = {
  templateId?: string;
  title?: string;
  storagePath?: string;
  pdfUrl?: string;
  publicUrl?: string;
  signedUrl?: string;
  html?: string;
  success?: boolean;
  message?: string;
  data?: {
    templateId?: string;
    title?: string;
    storagePath?: string;
    pdfUrl?: string;
    publicUrl?: string;
    signedUrl?: string;
    html?: string;
  };
};

/**
 * Creates a template from PDF file (FormData) or raw Arabic text
 */
export const createTemplate = (data: { title: string; rawArabicText?: string } | FormData) => {
  if (data instanceof FormData) {
    return uploadRequest<LegalTemplate>("/api/templates", data);
  }
  return request<LegalTemplate>("/api/templates", {
    method: "POST",
    data,
  });
};

/**
 * Deletes a template by ID
 */
export const deleteTemplate = (id: string) =>
  request<{ success: boolean; message: string }>(`/api/templates/${id}`, {
    method: "DELETE",
  });

/**
 * Fetches all available legal templates (normalizes grouped or array responses)
 */
export const getAllTemplates = async (): Promise<LegalTemplate[]> => {
  const raw = await request<any>("/api/templates");
  if (!raw) return [];

  const res = raw.data || raw;

  // Grouped response { myTemplates: [...], appTemplates: [...] }
  if (res.myTemplates || res.appTemplates) {
    const mine = (Array.isArray(res.myTemplates) ? res.myTemplates : []).map((t: any) => ({
      ...t,
      is_app_template: false,
    }));
    const app = (Array.isArray(res.appTemplates) ? res.appTemplates : []).map((t: any) => ({
      ...t,
      is_app_template: true,
    }));
    return [...mine, ...app];
  }

  // Flat array response
  if (Array.isArray(res)) return res;

  return [];
};

/**
 * Fetches details of a specific template
 */
export const getTemplateById = (id: string) =>
  request<LegalTemplate>(`/api/templates/${id}`);

export type SelectedLogo = {
  uri: string;
  name?: string;
  type?: string;
};

/**
 * Generates compiled HTML preview or final PDF document with form inputs
 */
export const generateDocument = async (
  templateId: string,
  formValues: Record<string, string>,
  options?: {
    preview?: boolean;
    customHtml?: string;
    logo?: SelectedLogo | null;
  }
): Promise<GenerateDocumentResponse> => {
  const query = options?.preview ? "?preview=true" : "";

  if (options?.logo) {
    const formData = new FormData();
    formData.append("form", JSON.stringify(formValues));
    formData.append("formValues", JSON.stringify(formValues));

    if (options.customHtml) {
      formData.append("customHtml", options.customHtml);
    }
    if (options.preview) {
      formData.append("preview", "true");
    }

    Object.entries(formValues).forEach(([k, v]) => {
      formData.append(k, String(v));
    });

    formData.append("logo", {
      uri: options.logo.uri,
      name: options.logo.name || "logo.png",
      type: options.logo.type || "image/png",
    } as any);

    const res: any = await uploadRequest<GenerateDocumentResponse>(
      `/api/documents/${templateId}${query}`,
      formData
    );

    return {
      ...res,
      pdfUrl: res?.pdfUrl || res?.data?.pdfUrl || res?.signedUrl || res?.data?.signedUrl,
      signedUrl: res?.signedUrl || res?.data?.signedUrl,
      publicUrl: res?.publicUrl || res?.data?.publicUrl,
      html: res?.html || res?.data?.html,
    };
  }

  return request<GenerateDocumentResponse>(`/api/documents/${templateId}${query}`, {
    method: "POST",
    data: {
      form: formValues,
      formValues,
      customHtml: options?.customHtml,
    },
  });
};
