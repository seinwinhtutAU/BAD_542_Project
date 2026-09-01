# Campus Health Appointment & Medicine Management System

Web application for students to book appointments with university doctors, authenticated via the University's Microsoft Active Directory. Doctors manage appointments and prescriptions; administrators manage users, doctors, and schedules. Integrates with a peer team's Campus Emergency & Safety Alert System and uses DeepSeek to summarize reported symptoms for doctors.

See [docs/req.md](docs/req.md) and [docs/Design_Document_Campus_Health_Appointment_System.pdf](docs/Design_Document_Campus_Health_Appointment_System.pdf) for the full requirements and design.

## Quick start

Gets you logged in at `http://localhost:5173` with a dev-login test account. No Azure AD setup needed for this path — see [Setup](#setup) below for AD login and the Docker Compose / VPS deploy details this glosses over.

```bash
# 1. Database (Docker)
cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml -f docker/docker-compose.local.yml up -d mysql

# 2. Backend (also seeds the admin@test.com / admin123 test account)
cd backend && cp .env.example .env
npm install && npx prisma migrate dev
npm run dev &   # keep this running; :4000

# 3. Frontend
cd ../frontend && cp .env.example .env
npm install && npm run dev   # :5173
```

Log in at `http://localhost:5173` with `admin@test.com` / `admin123`.

## Architecture

```
Users -> Nginx (HTTPS, /project path) -> React frontend
                                       -> Node.js/Express API -> Prisma -> MySQL
                                                                -> Azure AD (auth)
                                                                -> Azure Key Vault (secrets)
                                                                -> DeepSeek API (symptom summary)
                                                                -> Peer team API (alerts)
```

The frontend's production build is served under the `/project` path (`VITE_BASE_PATH`), matching the VPS's outer nginx, which also proxies `/project/api/` straight to the backend and strips the prefix before forwarding `/project/` itself to the frontend container. Hitting the Docker frontend image directly with no such proxy in front (e.g. `http://localhost:8081/`) doesn't work around this — the built asset URLs and API calls are baked in at `/project/...`, which don't exist at that path inside the container, so you get a blank page or a "text/html instead of a JS module" console error. Day-to-day local dev doesn't hit this at all — use `npm run dev` for both frontend and backend (see Setup below).

## Setup

The detailed version of Quick Start above, with the reasoning behind each step.

### 1. Database

Start MySQL via Docker Compose — its credentials already match `backend/.env`:

```bash
cp docker/.env.example docker/.env   # set MYSQL_PASSWORD / MYSQL_ROOT_PASSWORD
docker compose -f docker/docker-compose.yml -f docker/docker-compose.local.yml up -d mysql
```

- `backend/.env`'s `DATABASE_URL` should end up as `mysql://campus_health:campus_health_dev@localhost:3306/campus_health` (use a real password and narrower grants for anything beyond local dev).
- The `-f docker/docker-compose.local.yml` part matters: the base `docker-compose.yml` deliberately does *not* publish MySQL's port to the host, because on the VPS that collides with an unrelated native `mysqld` already bound to `0.0.0.0:3306` (see that file's comment for the story). The local override adds the port publish back just for your machine — `deploy.sh` never touches it.

### 2. Backend

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL from step 1, and AZURE_AD_* to match the frontend
npm install
npx prisma migrate dev
npm run dev             # :4000
```

- `prisma migrate dev` runs [src/prisma/seed.js](backend/src/prisma/seed.js) automatically after applying migrations, which upserts a dev-login test account (`admin@test.com` / `admin123`, role `ADMIN`) — the dev-login form (`/api/auth/login/dev`) has nothing to authenticate against on a fresh database otherwise. Re-run it anytime with `npx prisma db seed`.
- Signing in via "Log in with University AD" doesn't need a seeded user — `POST /api/auth/login/ad` upserts a `STUDENT` user from the validated Azure AD token automatically. That flow needs `AZURE_AD_TENANT_ID`/`AZURE_AD_CLIENT_ID` in `backend/.env` to match `VITE_AZURE_AD_TENANT_ID`/`VITE_AZURE_AD_CLIENT_ID` in `frontend/.env` (step 3), and your browser to allow the Microsoft sign-in popup (Chrome silently blocks it on some sites — check the address bar for a blocked-popup icon if the button seems to do nothing).

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # :5173
```

### Optional: full stack via Docker Compose

Not needed for regular dev (steps 1–3 above cover that); this instead builds and runs the same Docker images the VPS deploys, for testing the images themselves:

```bash
cp docker/.env.example docker/.env   # compose reads .env from the same dir as the compose file, not the repo root
docker compose -f docker/docker-compose.yml up -d --build
```

- The `backend` service overrides `DATABASE_URL` from `backend/.env` (`environment:` in `docker-compose.yml`) to point at the `mysql` service by hostname — `backend/.env`'s own `DATABASE_URL` targets `localhost`, which is only correct for a host-run backend, not the containerized one.
- This build uses the `/project` base path (see the Architecture note above) — browsing it directly at `http://localhost:8081/` won't work without a path-stripping proxy in front, same as the VPS.

## Peer API integration

- **Consuming**: `GET {PEER_API_BASE_URL}/api/alerts` with header `x-api-key: PEER_API_KEY_OUTBOUND` — fetches active campus emergency alerts before confirming an appointment.
- **Exposing**: `GET /api/appointments?date=YYYY-MM-DD` with header `x-api-key` (one of `PEER_API_KEYS_INBOUND`) — lets the peer's Campus Emergency & Safety Alert System pull our appointment schedule for a given day.

Classmate/team name and the actual API key exchange to be filled in once assigned.

## Roles (RBAC)

| Role | Permissions |
|---|---|
| Student | Book/cancel appointments, view prescriptions |
| Doctor | Manage appointments, create prescriptions |
| Administrator | Manage users, doctors, appointments, configuration |
