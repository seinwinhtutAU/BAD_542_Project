# Campus Health Appointment & Medicine Management System

A web application for students to book appointments with university doctors,
authenticated via the university's Microsoft Active Directory. Doctors manage
their appointment queue and write prescriptions; administrators manage users,
doctors, and schedules. DeepSeek AI summarizes each student's reported
symptoms into a structured briefing for the attending doctor.

Full requirements and design: [docs/req.md](docs/req.md) and
[docs/Design_Document_Campus_Health_Appointment_System.pdf](docs/Design_Document_Campus_Health_Appointment_System.pdf).

## Tech stack

| Layer      | Technology                                 |
| ---------- | ------------------------------------------ |
| Frontend   | React + Vite                               |
| Backend    | Node.js / Express                          |
| Database   | MySQL, managed with Prisma ORM             |
| Auth       | JWT + RBAC, Microsoft Azure AD (MSAL/OIDC) |
| Secrets    | Azure Key Vault (production)               |
| AI         | DeepSeek (`deepseek-chat`)                 |
| Deployment | Docker Compose behind Nginx                |

## Architecture

```
Users -> Nginx (HTTPS, /project path) -> React frontend
                                       -> Node.js/Express API -> Prisma -> MySQL
                                                                -> Azure AD (auth)
                                                                -> Azure Key Vault (secrets)
                                                                -> DeepSeek API (symptom summary)
```

The production frontend build is served under the `/project` path
(`VITE_BASE_PATH`), matching the VPS's outer Nginx, which proxies
`/project/api/` to the backend and forwards `/project/` (prefix stripped) to
the frontend container. Because asset URLs and API calls are baked into the
build at `/project/...`, hitting the frontend Docker image directly without
that proxy in front (e.g. `http://localhost:8081/`) produces a blank page.
Day-to-day development doesn't hit this — use `npm run dev` for both apps.

## Quick start

Gets you logged in at `http://localhost:5173` with a dev-login test account.
No Azure AD setup needed for this path — see [Setup](#setup) below for AD
login, MySQL alternatives, and Docker Compose / VPS deployment.

```bash
# 1. Database (Docker)
cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml -f docker/docker-compose.local.yml up -d mysql

# 2. Backend
cd backend && cp .env.example .env
npm install && npx prisma migrate dev
npm run dev &   # keep running; :4000

# 3. Create a test account (fresh DB has no users)
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
new PrismaClient().user.upsert({
  where: { email: 'admin@au.edu' },
  update: {},
  create: { email: 'admin@au.edu', name: 'Admin', role: 'ADMIN', password: bcrypt.hashSync('admin123', 10) },
}).then(console.log);
"

# 4. Frontend
cd ../frontend && cp .env.example .env
npm install && npm run dev   # :5173
```

Log in at `http://localhost:5173` with `admin@au.edu` / `admin123`.

## Setup

### Database

The easiest path is Docker Compose's `mysql` service; its credentials already
match `backend/.env`. The base `docker-compose.yml` deliberately does not
publish MySQL's port to the host, since the VPS already has a native `mysqld`
bound to `0.0.0.0:3306`. For a host-run backend, publish the port via the
local-only override instead (never used by `deploy.sh`):

```bash
cp docker/.env.example docker/.env   # set MYSQL_PASSWORD / MYSQL_ROOT_PASSWORD
docker compose -f docker/docker-compose.yml -f docker/docker-compose.local.yml up -d mysql
```

Alternatively, use your own MySQL install. `prisma migrate dev` needs a
"shadow database" to diff against, so the user needs privileges to create
databases, not just access `campus_health`:

```bash
mysql -u root <<'EOF'
CREATE DATABASE IF NOT EXISTS campus_health;
CREATE USER IF NOT EXISTS 'campus_health'@'localhost' IDENTIFIED BY 'campus_health_dev';
GRANT ALL PRIVILEGES ON *.* TO 'campus_health'@'localhost';
FLUSH PRIVILEGES;
EOF
```

Either way, `backend/.env`'s `DATABASE_URL` should end up as:

```
DATABASE_URL="mysql://campus_health:campus_health_dev@localhost:3306/campus_health"
```

(Use a real password and narrower grants for anything beyond local dev.)

### Backend

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL as above, and AZURE_AD_* to match the frontend
npm install
npx prisma migrate dev
npm run dev
```

There is no seed script, so a fresh database has no users — the dev-login
form (`POST /api/auth/login/dev`) has nothing to authenticate against until
you create one (see step 3 of Quick start).

Signing in via "Log in with University AD" doesn't need a seeded user —
`POST /api/auth/login/ad` upserts a `STUDENT` user from the validated Azure
AD token automatically. That flow needs `AZURE_AD_TENANT_ID` /
`AZURE_AD_CLIENT_ID` in `backend/.env` to match `VITE_AZURE_AD_TENANT_ID` /
`VITE_AZURE_AD_CLIENT_ID` in `frontend/.env`, and your browser to allow the
Microsoft sign-in popup.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Full stack locally via Docker Compose

Not needed for regular development (use `npm run dev` above). This reproduces
the VPS build, including the `/project` base path noted in Architecture
above:

```bash
cp docker/.env.example docker/.env   # compose reads .env from the same dir as the compose file, not the repo root
docker compose -f docker/docker-compose.yml up -d --build
```

The `backend` service overrides `DATABASE_URL` from `backend/.env` to point
at the `mysql` service by hostname — `backend/.env`'s own `DATABASE_URL`
targets `localhost`, which is only correct for a host-run backend.

### Deployment

`deploy.sh` builds and deploys the Docker Compose stack on the VPS behind the
Nginx configuration in [nginx/](nginx). See
[docs/VPS_DEPLOYMENT_RUNBOOK.md](docs/VPS_DEPLOYMENT_RUNBOOK.md) for the full
runbook.

## Roles (RBAC)

| Role          | Permissions                                          |
| ------------- | ---------------------------------------------------- |
| Student       | Book/cancel appointments, view prescriptions         |
| Doctor        | Manage their appointment queue, create prescriptions |
| Administrator | Manage users, doctors, appointments, configuration   |

## External AI integration — DeepSeek

DeepSeek turns a student's free-text symptoms into a structured briefing for
the attending doctor during appointment booking. No separate route is
needed — the existing authenticated `POST /api/appointments` route triggers
the analysis.

```
Student frontend -> Express appointment route -> DeepSeek chat API
                 <- appointment containing original symptoms and AI analysis
```

The backend calls the `deepseek-chat` model and requests JSON fields named
`summary`, `urgency`, `suggestedSpecialty`, and `safetyNote`. The API key is
never sent to the frontend or returned in any API response. In production,
`bootstrapSecrets()` retrieves the `DEEPSEEK-API-KEY` secret from Azure Key
Vault at startup using `DefaultAzureCredential`. For local development only,
`DEEPSEEK_API_KEY` may be placed in the uncommitted `backend/.env` file.

If DeepSeek is unavailable, the backend logs diagnostic details server-side
and returns a safe `503` response; the API key is never logged.

### Configure Key Vault

```bash
az keyvault secret set \
  --vault-name <your-key-vault-name> \
  --name DEEPSEEK-API-KEY \
  --value "$DEEPSEEK_API_KEY"
```

Production also needs `AZURE_KEY_VAULT_URL` and an Azure identity with
permission to read secrets. The backend uses `https://api.deepseek.com` by
default; override with `DEEPSEEK_API_BASE_URL` only when required.

### Test the integration

Obtain a student JWT through the login flow, then use a real doctor ID and a
future clinic slot:

```bash
curl -X POST http://localhost:4000/api/appointments \
  -H "Authorization: Bearer <STUDENT_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": 1,
    "appointmentDate": "2099-05-14T10:00:00.000Z",
    "symptoms": "Headache and sore throat for two days"
  }'
```

The response is the created appointment. Its `symptoms` field contains the
original text followed by a readable "AI symptom analysis" section.

## CI

[.github/workflows/ci.yml](.github/workflows/ci.yml) installs dependencies
and runs `prisma generate` for the backend and `vite build` for the frontend
on every push and pull request to `main`.
