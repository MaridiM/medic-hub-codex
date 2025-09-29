import { z } from "zod";

export type TenantType = "organization" | "specialist";

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  createdAt: string;
}

export type UserRole =
  | "owner"
  | "clinic_admin"
  | "doctor"
  | "assistant"
  | "inventory_manager"
  | "accountant"
  | "user"
  | "guest";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  tenantId: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  phoneE164: string;
  email?: string;
  name: string;
  birthDate?: string;
  gender?: "male" | "female" | "other";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const patientSchema = z.object({
  phoneE164: z.string().min(8),
  email: z.string().email().optional(),
  name: z.string().min(1),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  tags: z.array(z.string()).default([]),
});

export interface PatientProfile {
  id: string;
  tenantId: string;
  patientId: string;
  anamnesis: Record<string, unknown>;
  allergies: Record<string, unknown>;
  chronic: Record<string, unknown>;
  immunizations?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const patientProfileSchema = z.object({
  patientId: z.string(),
  anamnesis: z.record(z.unknown()).default({}),
  allergies: z.record(z.unknown()).default({}),
  chronic: z.record(z.unknown()).default({}),
  immunizations: z.record(z.unknown()).optional(),
});

export type VisitStatus =
  | "draft"
  | "confirmed"
  | "arrived"
  | "no-show"
  | "in-progress"
  | "done"
  | "cancelled";

export interface Visit {
  id: string;
  tenantId: string;
  patientProfileId: string;
  doctorId: string;
  roomId?: string;
  start: string;
  end: string;
  status: VisitStatus;
  services: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const visitSchema = z.object({
  tenantId: z.string(),
  patientProfileId: z.string(),
  doctorId: z.string(),
  roomId: z.string().optional(),
  start: z.string(),
  end: z.string(),
  status: z
    .enum([
      "draft",
      "confirmed",
      "arrived",
      "no-show",
      "in-progress",
      "done",
      "cancelled",
    ])
    .default("draft"),
  services: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export interface Service {
  id: string;
  code: string;
  name: string;
  durationMin: number;
  price: number;
  resources: {
    doctor?: string;
    room?: string;
    equipment?: string[];
  };
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export const serviceSchema = z.object({
  tenantId: z.string(),
  code: z.string(),
  name: z.string(),
  durationMin: z.number().int().positive(),
  price: z.number().nonnegative(),
  resources: z
    .object({
      doctor: z.string().optional(),
      room: z.string().optional(),
      equipment: z.array(z.string()).optional(),
    })
    .default({}),
});

export type InvoiceStatus = "issued" | "partially-paid" | "paid" | "void";

export interface InvoiceLine {
  id: string;
  serviceId: string;
  qty: number;
  price: number;
  tax?: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  patientProfileId: string;
  total: number;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  paidAt?: string;
  provider?: string;
  createdAt: string;
  updatedAt: string;
}

export const invoiceSchema = z.object({
  tenantId: z.string(),
  patientProfileId: z.string(),
  lines: z
    .array(
      z.object({
        serviceId: z.string(),
        qty: z.number().positive(),
        price: z.number().nonnegative(),
        tax: z.number().nonnegative().optional(),
      })
    )
    .nonempty(),
});

export interface FileRecord {
  id: string;
  tenantId: string;
  patientProfileId: string;
  url: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const fileSchema = z.object({
  tenantId: z.string(),
  patientProfileId: z.string(),
  url: z.string(),
  tags: z.array(z.string()).default([]),
});

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  name: string;
  channel: "email" | "sms" | "telegram";
  subject?: string;
  body: string;
  locale: "ru" | "uk" | "en";
  createdAt: string;
  updatedAt: string;
}

export const notificationTemplateSchema = z.object({
  tenantId: z.string(),
  name: z.string(),
  channel: z.enum(["email", "sms", "telegram"]),
  subject: z.string().optional(),
  body: z.string(),
  locale: z.enum(["ru", "uk", "en"]).default("ru"),
});

export interface NotificationRecord {
  id: string;
  tenantId: string;
  to: string;
  channel: "email" | "sms" | "telegram";
  templateId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const notificationSchema = z.object({
  tenantId: z.string(),
  to: z.string(),
  channel: z.enum(["email", "sms", "telegram"]),
  templateId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
});

export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  assigneeId?: string;
  status: "todo" | "in-progress" | "done";
  createdAt: string;
  updatedAt: string;
}

export const taskSchema = z.object({
  tenantId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(["todo", "in-progress", "done"]).default("todo"),
});
