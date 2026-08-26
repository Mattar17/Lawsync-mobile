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

export const CASE_TYPES = [
  "مدني",
  "جنائي",
  "تجاري",
  "عمالي",
  "أحوال شخصية",
  "إداري",
  "تنفيذ",
  "تعويضات",
  "إيجارات",
  "اقتصادي",
  "ضرائب",
  "جمارك",
] as const;
export type CaseType = (typeof CASE_TYPES)[number];

export const CASE_DEGREES = ["أول درجة", "استئناف", "نقض", "التماس"] as const;
export type CaseDegree = (typeof CASE_DEGREES)[number];

type CaseT = {
  description: string;
  case_number: string;
  case_year: string;

  client_name: string;
  client_opponent_name: string;

  client_role: string;
  client_opponent_role?: string;

  client_national_id: string;
  client_opponent_national_id: string;

  latest_court_session_date: string;
  next_court_session_date: string;

  case_status: CaseStatus;
  case_notes?: string;
  case_type?: CaseType;
  case_degree?: CaseDegree;
  client_type?: string;
  court_name?: string;
  court_circuit?: string;
};

export type { CaseT };
export default CaseT;
