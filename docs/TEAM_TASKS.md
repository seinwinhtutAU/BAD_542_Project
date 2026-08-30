# Team Task Split — Campus Health Appointment & Medicine Management System

BAD 542 project, 3 members. Due date: **Wednesday, 23 September 2026**. Today: 30 August 2026 — about 3.5 weeks left.

The project scaffold (backend, frontend, Docker, Nginx configs) is already committed to the repo. This document splits the remaining work three ways by layer, so each person can work mostly independently.

## Roles

### 1. Backend Owner
Assigned to: _______________

Owns everything in [`backend/`](../backend):
- [ ] Finish Prisma schema/migrations if the data model needs changes beyond the current `User` / `Doctor` / `Appointment` / `Prescription` tables
- [ ] Flesh out controllers/routes: auth, users, doctors, appointments, prescriptions
- [ ] Replace the Azure AD stub in [`azureAd.service.js`](../backend/src/services/azureAd.service.js) with real MSAL/OIDC token validation against the University tenant
- [ ] Wire up JWT + RBAC middleware fully (already scaffolded, needs testing against real routes)
- [ ] DeepSeek API integration for symptom summarization ([`deepseek.service.js`](../backend/src/services/deepseek.service.js)) — needs a real API key
- [ ] Write/adjust the peer API endpoints (expose `GET /api/appointments?date=`, consume the peer's `GET /api/alerts`)
- [ ] Basic backend tests (at least for auth and appointment booking)

### 2. Frontend Owner
Assigned to: _______________

Owns everything in [`frontend/`](../frontend):
- [ ] Login page — hook up real Azure AD login button (currently disabled placeholder) once Backend Owner has the AD flow working
- [ ] Student dashboard: booking form, appointment list, cancel flow
- [ ] Doctor dashboard: appointment list, confirm/complete flow, prescription form
- [ ] Admin dashboard: user role management, doctor CRUD
- [ ] Polish UI/UX (the current scaffold is functional but unstyled — add CSS/component library of your choice)
- [ ] Handle error states and loading states consistently across pages

### 3. Infra & Integrations Owner
Assigned to: _______________

This work barely touches backend/frontend code, so it can start immediately and run in parallel with the other two:
- [ ] Provision and harden the Linux VPS (Oracle Cloud or Azure)
- [ ] Install Docker + Docker Compose on the VPS
- [ ] Set up Nginx + Let's Encrypt SSL on the VPS, then wire in [`nginx/project-location.conf`](../nginx/project-location.conf) for the `/project` path
- [ ] Register the app in Azure AD (tenant/client ID, redirect URIs) — hand credentials to Backend Owner
- [ ] Create the Azure Key Vault, set up access policy/managed identity, add secrets (`DATABASE_URL`, `JWT_SECRET`, DeepSeek key, peer API key) once known
- [ ] Coordinate with the partner team for the peer API key exchange (issue them a key for your expose endpoint, get a key for their alerts endpoint)
- [ ] Own `deploy.sh` and the server-side `docker/.env` / `backend/.env` setup (see [README.md](../README.md#deployment))
- [ ] Confirm CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) stays green

## Shared / whoever has bandwidth

- [ ] README polish — architecture overview, setup instructions, peer API docs (course requirement for the GitHub repo grade)
- [ ] 10-minute video presentation — walk through the codebase (Key Vault integration + Prisma schema are explicitly called out in the rubric), demo core features live
- [ ] Final end-to-end test on the deployed system before submission

## Suggested timeline (3.5 weeks)

| Week | Focus |
|---|---|
| Week 1 (Aug 30 – Sep 5) | Infra: VPS + Docker + Nginx + SSL up. Backend: real AD auth working locally. Frontend: booking + dashboards wired to mock/real API. |
| Week 2 (Sep 6 – Sep 12) | Backend: DeepSeek + peer API done. Infra: Key Vault wired in, peer API key exchange completed. Frontend: all three dashboards functional. |
| Week 3 (Sep 13 – Sep 19) | Full integration testing on the deployed VPS. Fix bugs. Polish UI. |
| Final days (Sep 20 – Sep 23) | Record video, finish README, final submission check. |

## Key dependency points (don't skip these check-ins)

- **Frontend needs the API contract** (routes/request/response shapes) from Backend — already defined in the scaffold, so build against that unless it changes.
- **Backend needs Azure AD app registration** from Infra before real login can work.
- **Backend needs Key Vault secrets** from Infra before deploying with `NODE_ENV=production`.
- **Backend needs the peer team's API key and base URL** from Infra/whoever owns that relationship.
