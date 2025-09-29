import express from "express";
import cors from "cors";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import {
  authMiddleware,
  createTenant,
  createUser,
  generateToken,
  verifyCredentials,
  AuthenticatedRequest,
} from "./auth";
import { getStore } from "./store";
import {
  fileSchema,
  invoiceSchema,
  notificationSchema,
  notificationTemplateSchema,
  patientProfileSchema,
  patientSchema,
  serviceSchema,
  taskSchema,
  visitSchema,
} from "./types";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantName: z.string().min(2),
  tenantType: z.enum(["organization", "specialist"]),
});

app.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  const { email, password, tenantName, tenantType } = parsed.data;
  const store = getStore();
  if (store.users.some((u) => u.email === email)) {
    return res.status(400).json({ message: "User already exists" });
  }
  const tenant = createTenant(tenantName, tenantType);
  const user = await createUser(email, password, "owner", tenant.id);
  const token = generateToken(user);
  res.status(201).json({ token, tenant });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = generateToken(user);
  res.json({ token, tenantId: user.tenantId, role: user.role });
});

app.use(authMiddleware);

function ensureTenantAccess(req: AuthenticatedRequest, tenantId: string) {
  if (!req.user) return false;
  return req.user.tenantId === tenantId;
}

// Patients
app.post("/patients", (req: AuthenticatedRequest, res) => {
  const parsed = patientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  const now = new Date().toISOString();
  const patient = {
    id: uuid(),
    ...parsed.data,
    tags: parsed.data.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  getStore().patients.push(patient);
  res.status(201).json(patient);
});

app.get("/patients", (_req, res) => {
  res.json(getStore().patients);
});

app.get("/patients/:id", (req, res) => {
  const patient = getStore().patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  res.json(patient);
});

app.patch("/patients/:id", (req, res) => {
  const patient = getStore().patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  const parsed = patientSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  Object.assign(patient, parsed.data, { updatedAt: new Date().toISOString() });
  res.json(patient);
});

// Patient profiles per tenant
app.post("/tenants/:tenantId/patient-profiles", (req: AuthenticatedRequest, res) => {
  const { tenantId } = req.params;
  if (!ensureTenantAccess(req, tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const parsed = patientProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  const now = new Date().toISOString();
  const profile = {
    id: uuid(),
    tenantId,
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  };
  getStore().patientProfiles.push(profile);
  res.status(201).json(profile);
});

app.get("/tenants/:tenantId/patient-profiles", (req: AuthenticatedRequest, res) => {
  const { tenantId } = req.params;
  if (!ensureTenantAccess(req, tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const profiles = getStore().patientProfiles.filter((p) => p.tenantId === tenantId);
  res.json(profiles);
});

app.get("/patient-profiles/:id", (req: AuthenticatedRequest, res) => {
  const profile = getStore().patientProfiles.find((p) => p.id === req.params.id);
  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }
  if (!ensureTenantAccess(req, profile.tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  res.json(profile);
});

// Services
app.post("/services", (req: AuthenticatedRequest, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  const { tenantId } = parsed.data;
  if (!ensureTenantAccess(req, tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const now = new Date().toISOString();
  const service = {
    id: uuid(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  };
  getStore().services.push(service);
  res.status(201).json(service);
});

app.get("/services", (req: AuthenticatedRequest, res) => {
  const services = getStore().services.filter((s) => ensureTenantAccess(req, s.tenantId));
  res.json(services);
});

// Visits
app.post("/visits", (req: AuthenticatedRequest, res) => {
  const parsed = visitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  const { tenantId } = parsed.data;
  if (!ensureTenantAccess(req, tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const now = new Date().toISOString();
  const visit = {
    id: uuid(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  };
  getStore().visits.push(visit);
  res.status(201).json(visit);
});

app.get("/visits", (req: AuthenticatedRequest, res) => {
  const visits = getStore().visits.filter((v) => ensureTenantAccess(req, v.tenantId));
  res.json(visits);
});

const visitStatusValues = [
  "draft",
  "confirmed",
  "arrived",
  "no-show",
  "in-progress",
  "done",
  "cancelled",
] as const;

const statusSchema = z.object({
  status: z.enum(visitStatusValues),
});

app.patch("/visits/:id/status", (req: AuthenticatedRequest, res) => {
  const visit = getStore().visits.find((v) => v.id === req.params.id);
  if (!visit) {
    return res.status(404).json({ message: "Visit not found" });
  }
  if (!ensureTenantAccess(req, visit.tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  visit.status = parsed.data.status;
  visit.updatedAt = new Date().toISOString();
  res.json(visit);
});

// Invoices
app.post("/invoices", (req: AuthenticatedRequest, res) => {
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  const { tenantId, lines } = parsed.data;
  if (!ensureTenantAccess(req, tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const total = lines.reduce((sum, line) => sum + line.qty * line.price + (line.tax ?? 0), 0);
  const now = new Date().toISOString();
  const invoice = {
    id: uuid(),
    ...parsed.data,
    status: "issued" as const,
    lines: lines.map((line) => ({ ...line, id: uuid() })),
    total,
    createdAt: now,
    updatedAt: now,
  };
  getStore().invoices.push(invoice);
  res.status(201).json(invoice);
});

app.get("/invoices/:id", (req: AuthenticatedRequest, res) => {
  const invoice = getStore().invoices.find((i) => i.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }
  if (!ensureTenantAccess(req, invoice.tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  res.json(invoice);
});

const paySchema = z.object({
  provider: z.string(),
});

app.post("/invoices/:id/pay", (req: AuthenticatedRequest, res) => {
  const invoice = getStore().invoices.find((i) => i.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }
  if (!ensureTenantAccess(req, invoice.tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const parsed = paySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  invoice.status = "paid";
  invoice.provider = parsed.data.provider;
  invoice.paidAt = new Date().toISOString();
  invoice.updatedAt = invoice.paidAt;
  res.json(invoice);
});

// Files
app.post("/files/upload", (req: AuthenticatedRequest, res) => {
  const parsed = fileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  if (!ensureTenantAccess(req, parsed.data.tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const now = new Date().toISOString();
  const file = {
    id: uuid(),
    ...parsed.data,
    tags: parsed.data.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  getStore().files.push(file);
  res.status(201).json(file);
});

app.get("/files/:id", (req: AuthenticatedRequest, res) => {
  const file = getStore().files.find((f) => f.id === req.params.id);
  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }
  if (!ensureTenantAccess(req, file.tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  res.json(file);
});

app.delete("/files/:id", (req: AuthenticatedRequest, res) => {
  const store = getStore();
  const index = store.files.findIndex((f) => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "File not found" });
  }
  const file = store.files[index];
  if (!ensureTenantAccess(req, file.tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  store.files.splice(index, 1);
  res.status(204).send();
});

// Notifications
app.post("/notifications/templates", (req: AuthenticatedRequest, res) => {
  const parsed = notificationTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  if (!ensureTenantAccess(req, parsed.data.tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const now = new Date().toISOString();
  const template = {
    id: uuid(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  };
  getStore().templates.push(template);
  res.status(201).json(template);
});

app.post("/notifications/send", (req: AuthenticatedRequest, res) => {
  const parsed = notificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  if (!ensureTenantAccess(req, parsed.data.tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const now = new Date().toISOString();
  const notification = {
    id: uuid(),
    ...parsed.data,
    createdAt: now,
  };
  getStore().notifications.push(notification);
  res.status(201).json({
    ...notification,
    status: "queued",
  });
});

// Tasks
app.post("/tasks", (req: AuthenticatedRequest, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  if (!ensureTenantAccess(req, parsed.data.tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const now = new Date().toISOString();
  const task = {
    id: uuid(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  };
  getStore().tasks.push(task);
  res.status(201).json(task);
});

app.get("/tasks", (req: AuthenticatedRequest, res) => {
  const tasks = getStore().tasks.filter((t) => ensureTenantAccess(req, t.tenantId));
  res.json(tasks);
});

app.patch("/tasks/:id", (req: AuthenticatedRequest, res) => {
  const task = getStore().tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }
  if (!ensureTenantAccess(req, task.tenantId)) {
    return res.status(403).json({ message: "Tenant mismatch" });
  }
  const parsed = taskSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }
  Object.assign(task, parsed.data, { updatedAt: new Date().toISOString() });
  res.json(task);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${PORT}`);
});
