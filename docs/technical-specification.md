# Medic HUB → Doctor Lab (DL) — Technical Specification v1.0

**Project:** Medic HUB → Doctor Lab (DL)

**Document Version:** v1.0 (MVP + PRO scope)

**Date:** 2025-09-19

**Stakeholders:** Product Owner, Tech Lead (FE/BE), QA Lead, DevOps Lead, UX Lead

---

## 1. Goal and Scope

Build a multi-tenant medical web platform for solo doctors and clinics with the following core modules: EMR-light, Scheduling/Booking, Services/Pricing, Billing/Payments, Reminders/Communications, Staff/Roles, Basic Analytics, and Files. PRO extensions include treatment plans with auto-booking, inventory/consumables, deduplication, doctor/branch-specific price lists, prepayments/refunds, omnichannel chat, advanced analytics, and branches.

Features tagged **[MVP]** are required for the initial release; features tagged **[PRO]** or **[LATER]** arrive in subsequent iterations.

---

## 2. Functional Requirements

### 2.1 Authentication and Multi-Tenancy

- Registration/login via email and password; optional phone OTP. [MVP]
- Tenant equals organization. Solo doctors are created as single-tenant `specialist`. [MVP]
- Roles: Owner, Clinic Admin, Doctor, Assistant/Reception, Inventory Manager, Accountant, user, guest. [MVP]
- Invite staff via email/SMS, activate, assign roles. [MVP]
- Sub-organizations (branches) with distinct calendars/pricing/inventory. [PRO]

### 2.2 Patients and EMR-light

- Global patient model (phone E.164, email) with tenant-specific patient profiles. [MVP]
- CRUD operations for patient and per-tenant profile. [MVP]
- Profile fields: full name, DOB, gender, contacts, tags, anamnesis, allergies, chronic conditions, vaccinations (optional), insurance (PRO), emergency contact (PRO), custom fields (PRO). [MVP→PRO]
- File management: photos/PDF/scans, preview, tagging, linking to visits/treatments. [MVP]
- Patient timeline of events (visits, invoices, files, messages). [MVP]
- Deduplication by phone/email with merge wizard and audit trail. [PRO]
- Consents/forms: tenant templates, versions, e-signature, PDF archive. [PRO]

### 2.3 Services and Pricing

- CRUD services with code/category, duration, resources (doctor/room/equipment), base price. [MVP]
- Price lists per tenant/branch/doctor, currencies, inclusive/exclusive taxes. [PRO]
- Packages/bundles, cost/margin tracking based on recipes. [PRO]

### 2.4 Scheduling and Booking

- Calendar (day/week/month) with filters (doctor/room/equipment) and drag-and-drop. [MVP]
- Visit statuses: draft → confirmed → arrived/no-show → in-progress → done/cancelled. [MVP]
- Availability blocks, breaks, pre/post buffers. [MVP]
- Conflict management preventing double booking and suggesting next three slots. [MVP]
- Public booking widget/page with phone OTP. [PRO]
- Waitlist, cancellation policies, deposits/prepayments. [PRO]
- Reception QR check-in. [PRO]

### 2.5 Diagnosis, Treatment, and Planning

- Diagnoses via free text initially; transition to ICD-10/FDI/cosmetic dictionaries. [MVP→PRO]
- Treatment plans with phases, cost, duration, linkage to services/slots, statuses (draft/approved/partial/completed). [MVP]
- Auto-booking of slots and reminders when plan approved. [PRO]
- Execution checklists, before/after photos, complication tracking. [PRO]
- Visual schemas for dentistry/cosmetology. [PRO]

### 2.6 Communications and Notifications

- Channels: email, SMS, Telegram. [MVP]
- Tenant-specific templates for confirmations, reschedules, cancellations, invoices, thanks, reviews. [MVP]
- Reminder schedule at 7/3/1 days and 6/3/1 hours; DO-NOT-CONTACT flag, localization (RU/UK/EN). [MVP]
- Omnichannel chat with inbound/outbound aggregation and anti-spam controls. [PRO]

### 2.7 Billing and Payments

- Invoices: issued/partially-paid/paid/void with line items from visits/plans. [MVP]
- Online payments through one or two providers (Apple/Google Pay/cards), plus QR. [MVP]
- Prepayments/deposits, refunds, AR, cash shifts with Z-reports. [PRO]
- Taxes/fiscalization via regional integrations. [LATER]

### 2.8 Inventory

- Basic inventory: catalog, units, categories, minimum stock alerts. [MVP]
- Recipes per service, reservations and write-offs (FEFO/FIFO), inventory counts, procurement. [PRO]

### 2.9 Analytics and Reporting

- Dashboards for revenue, utilization, no-shows, average bill, LTV, and top services. [MVP]
- Slicing by doctor/room/branch/service, cohort and funnel analysis, automated campaigns. [PRO]

### 2.10 Staff and Roles

- Staff CRUD, invitations, role assignments, branch/room association. [MVP]
- Shift scheduling, documents, KPI metrics, compensation plans. [PRO/LATER]

### 2.11 Task Management

- Task CRUD for personal/organization/role/assignee scopes with priorities, deadlines, checklists. [MVP]
- Linking to domains (patient/visit/invoice/inventory/treatment), SLA/escalations, recurrences. [PRO]

### 2.12 DL Assistant (Voice/Chat)

- Intents for booking/rescheduling/canceling visits, patient/treatment CRUD, invoices/payments, tasks, search. [PRO]
- Action confirmations, RBAC enforcement, assistant command audit. [PRO]

---

## 3. Non-Functional Requirements

- Availability: ≥99.5% (MVP), ≥99.9% (PRO) with paid plan SLAs.
- Performance: P50 page load < 2.5s; critical APIs < 400ms at P95.
- Scalability: horizontal for BFF and services; queue-based async tasks.
- Security: OWASP ASVS L1 (MVP) → L2 (PRO); TLS 1.2+, encrypted files at rest, httpOnly cookies, rate limiting, bruteforce protection, CSP.
- Localization: RU/UK/EN; phone format E.164; tenant-specific time zones.
- Accessibility: baseline WCAG 2.1 AA compliance.
- Observability: OpenTelemetry tracing, Prometheus/Grafana metrics, ELK/Cloud logging, PagerDuty alerts. [MVP→PRO]
- Backups/DR: daily DB/S3 backups, monthly restore tests. [MVP]

---

## 4. Architecture Overview

### 4.1 Frontend

- Stack: Next.js (App Router), React, TypeScript, Tailwind with shadcn/ui, TanStack Query, react-hook-form with zod, next-intl, Zustand.
- Structure: `/app/(clinic|patient|auth)` with shared UI components, API SDK, validators, RBAC helpers, and i18n.
- Principle: frontend hides UI based on roles, but backend enforces permissions.

### 4.2 Backend

- NestJS microservices: Auth/IAM, Tenant, Patient, PatientProfile, EMR, Calendar, Services/Pricing, Treatment, Billing/Payments, Inventory, Notifications, Chat, Files, Reports, Tasks, Audit.
- Infrastructure: Postgres, Redis, Kafka/RabbitMQ, MinIO (S3), API Gateway/BFF, OpenAPI 3.1, Avro/JSON schema events.
- Domain events: `Visit.*`, `Invoice.*`, `Patient.*`, `Inventory.*`, `Message.*`, `Task.*`.

---

## 5. API (MVP Excerpts)

### Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/invite`
- `POST /auth/accept`

### Patients

- `GET /patients?query=...`
- `POST /patients`
- `GET /patients/:id`
- `PATCH /patients/:id`
- `GET /tenants/:tid/patient-profiles`
- `POST /tenants/:tid/patient-profiles`
- `GET /patient-profiles/:id`
- `POST /patients/:id/merge` (PRO)

### Visits/Scheduling

- `GET /visits?filters`
- `POST /visits`
- `PATCH /visits/:id/status`
- `POST /visits/:id/checkin` (PRO)
- `GET /resources?type=doctor|room|equipment`

### Services/Pricing

- `GET /services`
- `POST /services`
- `GET /pricelists` (PRO)

### Invoices/Payments

- `POST /invoices`
- `GET /invoices/:id`
- `POST /invoices/:id/pay`
- `POST /invoices/:id/refund` (PRO)

### Files

- `POST /files/upload`
- `GET /files/:id`
- `DELETE /files/:id`

### Notifications

- `POST /notifications/send`
- `POST /notifications/templates` (PRO)

### Tasks

- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/:id`

---

## 6. High-Level Data Models

- **Patient:** `id, phoneE164, email?, name, birthDate?, gender?, tags[], createdAt, updatedAt`
- **PatientProfile:** `id, tenantId, patientId, anamnesis JSON, allergies JSON, chronic JSON, insurance JSON?, emergencyContact JSON?, customFields JSON, createdAt, updatedAt`
- **Visit:** `id, tenantId, patientProfileId, doctorId, roomId?, start, end, status, services JSON, notes`
- **Service/Variant:** `id, code, name, durationMin, price, resources JSON, taxRate?`
- **Invoice/InvoiceLine:** `id, tenantId, patientProfileId, total, status; lines: serviceVariantId, qty, price, tax`
- **File:** `id, tenantId, patientProfileId, url, tags[]`

---

## 7. UX and Interfaces (MVP)

- **Scheduling:** Calendar with filters, drag-and-drop, quick search, shortcuts (N/F/S).
- **Patient Card:** Header (name/contact/tags), tabs (timeline/files/invoices), quick actions.
- **Booking Wizard:** Patient → service → slot → optional prepayment → confirmation → notifications.
- **Invoice/Payment:** List view, details, PDF/print, QR/link.
- **Organization Settings:** Hours, policies, notification templates.
- **Staff/Roles:** Invitations and assignments.

**UX Deliverables:** user flows, low-fidelity wireframes, design system (tokens), component specs (shadcn/ui extensions), clickable prototype.

---

## 8. Data Requirements and Migration

- Initial setup: create a solo tenant upon solo doctor registration.
- Solo-to-organization migration: guided transfer maintaining relations. [MVP]
- Retention policies: files for 7 years (medical docs), audit logs for 2 years (configurable).
- Patient import/export via CSV with secure upload. [PRO]

---

## 9. Security and Compliance

- RBAC/ABAC with backend enforcement, JWT RS256 tokens, short-lived access tokens with rotating refresh tokens.
- Password policies, 2FA (PRO), session/device tracking, IP allowlists (PRO).
- PII/PHI: encrypted files at rest, masked phone search via hash index.
- Audit logs: file access/downloads, CRUD on PII/PHI, status changes, logins.
- Exports: pseudonymization and PDF watermarks. [PRO]

---

## 10. Quality and Testing

- **Definition of Ready:** documented user stories, acceptance criteria, mock data, API schemas.
- **Definition of Done:** unit test coverage ≥70% for core modules, integration tests for critical paths, end-to-end scenarios (booking → payment → reminders), performance reviews.
- QA plan covering unit (FE/BE), integration (API), e2e (Playwright/Cypress), contract (Pact), load (k6), security scanning (SAST/DAST).
- Test cases for registration, patient search, booking/rescheduling, payment, reminders, access control.
- UAT scripts for Owner/Admin/Doctor/Assistant/Solo roles.

---

## 11. DevOps, CI/CD, and Environments

- Environments: dev, staging, prod.
- CI: lint/type checks, unit tests, image builds (Kaniko), migrations, Kubernetes deploy via Helm, database migrations with rollback.
- CD: blue-green or rolling deployments, feature flags.
- Secrets via Vault/SealedSecrets and KMS.
- Monitoring: Prometheus, Grafana, Loki/ELK, Alertmanager.
- Access/audit logs stored in dedicated index.

---

## 12. Release Plan

### 12.1 MVP (12–14 weeks, sprint breakdown)

1. Architecture, Auth/IAM, Tenant services, base UI shell.
2. Patients/Profiles/Files (view + CRUD), patient timeline.
3. Scheduling/Resources/Statuses, booking wizard, email/SMS/Telegram reminders.
4. Services/Pricing basics, billing/payments (1–2 providers), PDF/QR outputs.
5. Analytics basics, audit/security, CSV/PDF exports.
6. Staff/Roles, personal tasks, UX polish, UAT/hardening.

### 12.2 PRO (3–4 releases of 4–6 weeks)

- Treatment plans with auto-booking, before/after photos, deduplication.
- Price lists per doctor/branch, taxes, prepayments/refunds.
- Inventory: recipes, reservations/write-offs, procurement, inventory counts, alerts.
- Omnichannel chat + anti-spam, branches, advanced analytics/cohorts.
- MFA/IP allowlists/device logs; tasks with SLA/templates/recurrence.

---

## 13. Risks and Dependencies

- Regional constraints for payments/SMS/messengers.
- Licensing for ICD-10/FDI dictionaries and fiscalization requirements.
- Data anonymization for analytics.

---

## 14. Acceptance Criteria (Excerpt)

- Prevent double-booking of resources and suggest ≥3 slots within 300 ms. [MVP]
- Patients flagged `doNotContact` skip notifications; fallback channel triggers after >2 minutes undelivered. [MVP→PRO]
- Invoice payment transitions `issued → paid`, recording `paidAt`, `provider`, immutable PDF receipt. [MVP]
- Any file download logged with user, timestamp, IP/UA. [MVP]
- Cancelled visits with prepayments follow cancellation policy (retain/refund). [PRO]

---

## 15. Appendices

- A. ER diagram (link to Mermaid specification v0.2).
- B. Draft OpenAPI (to generate after DTO freeze).
- C. Notification templates (RU/UK/EN).
- D. Complete RBAC matrix.
- E. Domain event map.

---

*End of Technical Specification v1.0*
