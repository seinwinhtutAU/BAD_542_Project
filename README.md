# Campus Health Appointment & Medicine Management System

Web application for students to book appointments with university doctors, authenticated via the University's Microsoft Active Directory. Doctors manage appointments and prescriptions; administrators manage users, doctors, and schedules. Integrates with a peer team's Campus Emergency & Safety Alert System and uses DeepSeek to summarize reported symptoms for doctors.

See [docs/req.md](docs/req.md) and [docs/Design_Document_Campus_Health_Appointment_System.pdf](docs/Design_Document_Campus_Health_Appointment_System.pdf) for the full requirements and design.

## Architecture

```
Users -> Nginx (HTTPS, /project path) -> React frontend
                                       -> Node.js/Express API -> Prisma -> MySQL
                                                                -> Azure AD (auth)
                                                                -> Azure Key Vault (secrets)
                                                                -> DeepSeek API (symptom summary)
                                                                -> Peer team API (alerts)
```

The frontend's production build is served under the `/project` path (`VITE_BASE_PATH`), matching the VPS's outer nginx, which also proxies `/project/api/` straight to the backend and strips the prefix before forwarding `/project/` itself to the frontend container. Hitting the Docker frontend image directly with no such proxy in front (e.g. `http://localhost:8081/`) doesn't work around this — the built asset URLs and API calls are baked in at `/project/...`, which don't exist at that path inside the container, so you get a blank page or a "text/html instead of a JS module" console error. Use `docker/docker-compose.local.yml` (see below) to build a root-path variant for standalone local testing instead of fighting the `/project/` prefix.

## Setup

### Database

The easiest path is Docker Compose's `mysql` service, since its credentials already match `backend/.env`. The base `docker-compose.yml` deliberately does *not* publish MySQL's port to the host — on the VPS that collides with an unrelated native `mysqld` already bound to `0.0.0.0:3306` (see [docker/docker-compose.local.yml](docker/docker-compose.local.yml)'s comment for the story). For a host-run backend (`npm run dev`), publish the port via the local-only override instead, which `deploy.sh` never touches:

```bash
cp docker/.env.example docker/.env   # set MYSQL_PASSWORD / MYSQL_ROOT_PASSWORD
docker compose -f docker/docker-compose.yml -f docker/docker-compose.local.yml up -d mysql   # publishes 3306 to localhost
```

Alternatively, use a MySQL install of your own. `prisma migrate dev` needs a "shadow database" to diff against, so the user needs privileges to create databases, not just access `campus_health`:

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
cp .env.example .env   # then edit DATABASE_URL as above, and AZURE_AD_* to match the frontend
npm install
npx prisma migrate dev
npm run dev
```

There is no seed script, so a fresh database has no users — the dev-login form (`/api/auth/login/dev`) has nothing to authenticate against until you create one. Create a local test account with:

```bash
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const password = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: { email: 'admin@test.com', name: 'Admin', password, role: 'ADMIN' },
  });
  console.log(user);
  await prisma.\$disconnect();
})();
"
```

Signing in via "Log in with University AD" doesn't need a seeded user — `POST /api/auth/login/ad` upserts a `STUDENT` user from the validated Azure AD token automatically. That flow needs `AZURE_AD_TENANT_ID`/`AZURE_AD_CLIENT_ID` in `backend/.env` to match `VITE_AZURE_AD_TENANT_ID`/`VITE_AZURE_AD_CLIENT_ID` in `frontend/.env`, and your browser to allow the Microsoft sign-in popup (Chrome silently blocks it on some sites — check the address bar for a blocked-popup icon if the button seems to do nothing).

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Full stack locally via Docker Compose

To reproduce the VPS setup as closely as possible (built with the `/project` base path — see the Architecture note above for why you still need a path-stripping proxy in front to browse it):

```bash
cp docker/.env.example docker/.env   # compose reads .env from the same dir as the compose file, not the repo root
docker compose -f docker/docker-compose.yml up -d --build
```

The `backend` service overrides `DATABASE_URL` from `backend/.env` (`environment:` in `docker-compose.yml`) to point at the `mysql` service by hostname — `backend/.env`'s own `DATABASE_URL` targets `localhost`, which is only correct for a host-run backend, not the containerized one.

To instead browse the stack directly at `http://localhost:8081/` (no reverse proxy, no `/project/` prefix), layer on the local override, which rebuilds the frontend with a root base path and points it at the backend directly:

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.local.yml up -d --build
```

AD login through this path additionally needs `http://localhost:8081/` registered as a redirect URI (platform type: Single-page application) on the Azure AD app registration, alongside the VPS's URI.

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
