import { request, uploadRequest } from "./client";

export const EGYPTIAN_GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "البحر الأحمر",
  "البحيرة",
  "الفيوم",
  "الغربية",
  "الإسماعيلية",
  "المنوفية",
  "المنيا",
  "القليوبية",
  "الوادي الجديد",
  "السويس",
  "أسوان",
  "أسيوط",
  "بني سويف",
  "بورسعيد",
  "دمياط",
  "الشرقية",
  "جنوب سيناء",
  "كفر الشيخ",
  "مطروح",
  "الأقصر",
  "قنا",
  "شمال سيناء",
  "سوهاج",
] as const;

export type EgyptianGovernorate = (typeof EGYPTIAN_GOVERNORATES)[number];

export const CLIENT_STATUSES = ["نشط", "متوقف"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_TYPES = [
  "فرد",
  "شركة تضامن",
  "شركة توصية بسيطة",
  "شركة مساهمة",
  "شركة ذات مسؤولية محدودة",
  "شركة الشخص الواحد",
  "جهة حكومية",
  "أخرى",
] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export type Client = {
  id: string;
  office_id: string;
  name: string;
  client_type?: string | null;
  file_number?: string | null;
  phone_number?: string | null;
  national_id?: string | null;
  national_id_path?: string | null;
  passport_path?: string | null;
  address?: string | null;
  job?: string | null;
  governorate?: EgyptianGovernorate | null;
  file_opening_date?: string | null;
  client_state?: ClientStatus;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateClientInput = {
  name: string;
  client_type?: string;
  file_number?: string;
  phone_number?: string;
  national_id?: string;
  address?: string;
  job?: string;
  governorate?: EgyptianGovernorate;
  file_opening_date?: string;
  client_state?: ClientStatus;
  notes?: string;
};

export type UpdateClientInput = Partial<CreateClientInput>;

export type DocumentUploadResponse = {
  lawyer_id: string;
  client_id: string;
  documents: {
    national_id?: {
      path: string;
      fullPath: string;
      publicUrl: string;
      fileName: string;
      mimetype: string;
      size: number;
    };
    passport?: {
      path: string;
      fullPath: string;
      publicUrl: string;
      fileName: string;
      mimetype: string;
      size: number;
    };
  };
};

export type ClientDocumentItem = {
  path: string;
  signedUrl: string | null;
} | null;

export type ClientDocumentsResponse = {
  client_id: string;
  documents: {
    national_id: ClientDocumentItem;
    passport: ClientDocumentItem;
  };
};

export const getOfficeClients = (officeId: string): Promise<Client[]> =>
  request<Client[]>(`/api/offices/${officeId}/clients`);

export const getClientById = (officeId: string, clientId: string): Promise<Client> =>
  request<Client>(`/api/offices/${officeId}/clients/${clientId}`);

export const createClient = (officeId: string, data: CreateClientInput): Promise<Client> =>
  request<Client>(`/api/offices/${officeId}/clients`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateClient = (
  officeId: string,
  clientId: string,
  data: UpdateClientInput
): Promise<Client> =>
  request<Client>(`/api/offices/${officeId}/clients/${clientId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteClient = (
  officeId: string,
  clientId: string
): Promise<{ success: boolean; message: string }> =>
  request<{ success: boolean; message: string }>(
    `/api/offices/${officeId}/clients/${clientId}`,
    {
      method: "DELETE",
    }
  );

export const uploadClientDocuments = (
  officeId: string,
  clientId: string,
  formData: FormData
): Promise<DocumentUploadResponse> =>
  uploadRequest<DocumentUploadResponse>(
    `/api/offices/${officeId}/clients/${clientId}/documents`,
    formData
  );

export const getClientDocuments = (
  officeId: string,
  clientId: string
): Promise<ClientDocumentsResponse> =>
  request<ClientDocumentsResponse>(
    `/api/offices/${officeId}/clients/${clientId}/documents`
  );

export const deleteClientDocument = (
  officeId: string,
  clientId: string,
  docType: "national_id" | "passport"
): Promise<{ success: boolean; message: string; data?: { client_id: string; doc_type: string } }> =>
  request<{ success: boolean; message: string; data?: { client_id: string; doc_type: string } }>(
    `/api/offices/${officeId}/clients/${clientId}/documents/${docType}`,
    {
      method: "DELETE",
    }
  );

