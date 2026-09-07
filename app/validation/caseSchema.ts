import { z } from "zod";
import { CLIENT_TYPES } from "../types";

const clientTypeValues = CLIENT_TYPES;

export const createCaseSchema = z.object({
  // Mandatory fields
  case_number: z.string().min(1, "رقم القضية مطلوب"),
  case_year: z.string().regex(/^\d{4}$/, "السنة غير صحيحة"),
  client_name: z.string().min(1, "اسم الموكل مطلوب"),
  client_opponent_name: z.string().min(1, "اسم الخصم مطلوب"),

  // Optional fields
  title: z.string().optional().nullable(),
  client_national_id: z
    .string()
    .regex(/^\d{14}$/, "الرقم القومي غير صحيح")
    .optional()
    .nullable()
    .or(z.literal("")),
  client_opponent_national_id: z
    .string()
    .regex(/^\d{14}$/, "الرقم القومي غير صحيح")
    .optional()
    .nullable()
    .or(z.literal("")),
  client_role: z.string().optional().nullable().or(z.literal("")),
  case_type: z.string().optional().nullable().or(z.literal("")),
  case_degree: z.string().optional().nullable().or(z.literal("")),
  client_type: z.enum(clientTypeValues).optional().nullable(),
  assigned_lawyer_id: z.string().uuid("معرف المحامي غير صالح").optional().nullable(),
  closed_at: z.string().optional().nullable(),
  court_circuit: z.string().optional().nullable(),
  court_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  latest_court_session_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (date) => !date || new Date(date) <= new Date(),
      "تاريخ آخر جلسة لا يمكن أن يكون في المستقبل",
    ),
  latest_update: z.string().optional().nullable(),
  next_court_session_date: z.string().optional().nullable(),
  opened_at: z.string().optional(),
});

export { clientTypeValues };
export const caseSchema = createCaseSchema;
export type CaseFormData = z.infer<typeof createCaseSchema>;
export default caseSchema;
