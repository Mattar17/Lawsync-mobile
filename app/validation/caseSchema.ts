import { z } from "zod";

const arabicEnglishNameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;

export const caseSchema = z.object({
  case_number: z
    .string()
    .min(1, "رقم القضية مطلوب")
    .regex(/^\d+$/, "رقم القضية يجب أن يحتوي على أرقام فقط"),

  case_year: z.string().regex(/^\d{4}$/, "سنة القضية يجب أن تكون 4 أرقام"),

  client_name: z
    .string()
    .min(4, "اسم الموكل يجب أن يحتوي على 4 أحرف على الأقل")
    .regex(arabicEnglishNameRegex, "اسم الموكل يجب أن يحتوي على حروف فقط"),

  client_opponent_name: z
    .string()
    .min(4, "اسم الخصم يجب أن يحتوي على 4 أحرف على الأقل")
    .regex(arabicEnglishNameRegex, "اسم الخصم يجب أن يحتوي على حروف فقط"),

  client_role: z.enum(["مدعي", "مدعي عليه"], {
    error: () => ({
      message: "صفة الموكل يجب أن تكون مدعي أو مدعي عليه",
    }),
  }),

  client_opponent_role: z.enum(["مدعي", "مدعي عليه"], {
    error: () => ({
      message: "صفة الخصم يجب أن تكون مدعي أو مدعي عليه",
    }),
  }),

  client_national_id: z
    .string()
    .regex(/^\d{14}$/, "الرقم القومي للموكل يجب أن يتكون من 14 رقم"),

  client_opponent_national_id: z
    .string()
    .regex(/^\d{14}$/, "الرقم القومي للخصم يجب أن يتكون من 14 رقم"),

  latest_court_session_date: z.string().min(1, "تاريخ الجلسة الماضية مطلوب"),

  next_court_session_date: z.string().min(1, "تاريخ الجلسة القادمة مطلوب"),

  case_status: z.string().min(1, "حالة القضية مطلوبة"),

  case_notes: z.string(),
});

export type CaseFormData = z.infer<typeof caseSchema>;
