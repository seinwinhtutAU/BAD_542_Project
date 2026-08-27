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

## Setup

### Local MySQL database

`backend/.env.example`'s `DATABASE_URL` is a placeholder — create a real database and user before running migrations. `prisma migrate dev` also needs a "shadow database" to diff against, so the user needs privileges to create databases, not just access `campus_health`:

```bash
mysql -u root <<'EOF'
CREATE DATABASE IF NOT EXISTS campus_health;
CREATE USER IF NOT EXISTS 'campus_health'@'localhost' IDENTIFIED BY 'campus_health_dev';
GRANT ALL PRIVILEGES ON *.* TO 'campus_health'@'localhost';
FLUSH PRIVILEGES;
EOF
```

Then set `backend/.env`:

```
DATABASE_URL="mysql://campus_health:campus_health_dev@localhost:3306/campus_health"
```

(Use a real password and narrower grants for anything beyond local dev.)

Backend:

```bash
cd backend
cp .env.example .env   # then edit DATABASE_URL as above
npm install
npx prisma migrate dev
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Full stack locally via Docker Compose:

```bash
cp docker/.env.example docker/.env   # compose reads .env from the same dir as the compose file, not the repo root
docker compose -f docker/docker-compose.yml up --build
```

## Deployment

`deploy.sh` is for the **VPS**, not local dev — it runs `git pull origin main` then rebuilds the Docker Compose stack, so it only makes sense on a machine that's a persistent clone of this repo tracking `origin/main`. Locally, just use `docker compose -f docker/docker-compose.yml up --build` directly, or run `npm run dev` in `backend/`/`frontend/` without Docker.

One-time setup on the server:

1. `git clone` this repo, install Docker + Docker Compose.
2. Create `docker/.env` and `backend/.env` by hand with real production values — both are gitignored, so `git pull` never brings them in.
3. Set `NODE_ENV=production` in `backend/.env`. This is required, not optional: [bootstrapSecrets.js](backend/src/config/bootstrapSecrets.js) only fetches secrets (`DATABASE_URL`, `JWT_SECRET`, etc.) from Azure Key Vault when `NODE_ENV=production`. Anything other than `production` skips Key Vault and falls back to whatever's literally sitting in `backend/.env`, which violates the "must not use local `.env` files for production secrets" requirement in [docs/req.md](docs/req.md). `deploy.sh` refuses to run if this isn't set correctly.
4. Wire up `nginx/project-location.conf` inside the VPS's existing Nginx `server {}` block for the `/project` path.

After that, redeploy any time with:

```bash
./deploy.sh
```

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
