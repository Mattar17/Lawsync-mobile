export const CASE_STATUSES = [
  "قضية جديدة",
  "قيد المراجعة",
  "تم رفع الدعوى",
  "قيد النظر",
  "انتظار الجلسة",
  "تم تحديد جلسة",
  "قيد التحقيق",
  "انتظار الحكم",
  "تم الاستئناف",
  "تنفيذ الحكم",
  "موقوفة",
  "مغلقة",
  "كسبت",
  "خُسرت",
  "تمت التسوية",
  "رُفضت",
  "تم التنازل عنها",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

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
export const clientTypeValues = CLIENT_TYPES;
export type ClientTypeEnum = ClientType;

export const PARTY_ROLES = ["مدعي", "مدعى عليه"] as const;
export type PartyRole = (typeof PARTY_ROLES)[number];

type CaseT = {
  id?: string;
  office_id?: string;

  // Mandatory fields
  case_number: string;
  case_year: string;
  client_name: string;
  client_opponent_name: string;

  // Optional fields
  title?: string | null;
  client_national_id?: string | null;
  client_opponent_national_id?: string | null;
  client_role?: string | null;
  client_opponent_role?: string | null;

  case_type?: string | null;
  case_degree?: string | null;
  client_type?: ClientType | string | null;

  assigned_lawyer_id?: string | null;
  closed_at?: string | null;
  court_circuit?: string | null;
  court_name?: string | null;
  description?: string | null;
  latest_court_session_date?: string | null;
  latest_update?: string | null;
  next_court_session_date?: string | null;
  opened_at?: string | null;

  // Additional status fields
  case_status?: CaseStatus;
  case_notes?: string;
  created_at?: string;
  updated_at?: string;
};

export type { CaseT };
export default CaseT;
