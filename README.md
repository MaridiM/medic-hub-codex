# Medic HUB → Doctor Lab (DL)

This repository contains the evolving implementation of the Medic HUB → Doctor Lab (DL) platform together with the governing technical specification.

## Getting Started

The first runnable asset in the repository is an API prototype that captures the core MVP flows described in the specification (authentication, multi-tenant patient management, scheduling, services, billing, files, notifications, and tasking).

### Prerequisites

- Node.js 18+
- pnpm, npm, or yarn package manager

### Install dependencies

```bash
npm install
```

### Start the API

```bash
npm run dev:api
```

The API starts on `http://localhost:3000` and exposes REST endpoints matching the MVP scope (see [API coverage](#api-coverage)).

## API Coverage

The table below highlights the endpoints that are currently implemented based on the MVP contract.

| Area | Endpoint(s) |
| --- | --- |
| Authentication | `POST /auth/register`, `POST /auth/login` |
| Patients & Profiles | `POST /patients`, `GET /patients`, `GET /patients/:id`, `PATCH /patients/:id`, `POST /tenants/:id/patient-profiles`, `GET /tenants/:id/patient-profiles`, `GET /patient-profiles/:id` |
| Scheduling & Visits | `POST /visits`, `GET /visits`, `PATCH /visits/:id/status` |
| Services & Pricing | `POST /services`, `GET /services` |
| Billing & Payments | `POST /invoices`, `GET /invoices/:id`, `POST /invoices/:id/pay` |
| Files | `POST /files/upload`, `GET /files/:id`, `DELETE /files/:id` |
| Notifications | `POST /notifications/templates`, `POST /notifications/send` |
| Tasks | `GET /tasks`, `POST /tasks`, `PATCH /tasks/:id` |
| Misc | `GET /health` |

All routes (except registration/login/health) require a bearer token issued by the authentication endpoints. The API enforces tenant boundaries server-side to honor the multi-tenant model.

## Documentation

- [Technical Specification v1.0](docs/technical-specification.md)

Further iterations will incrementally cover the remaining MVP and PRO capabilities as outlined in the specification.
