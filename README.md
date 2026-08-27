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

`deploy.sh` runs on the **VPS only**, not on your laptop. It does two things: pulls the latest code from `origin/main`, then rebuilds and restarts the Docker containers. Running it locally wouldn't make sense since you already have the latest code — for local work, just use `docker compose -f docker/docker-compose.yml up --build`, or `npm run dev` in `backend/`/`frontend/` as shown above.

### One-time setup on the server

1. **Clone the repo and install Docker.**
   ```bash
   git clone https://github.com/seinwinhtutAU/BAD_542_Project.git
   cd BAD_542_Project
   ```
   Install Docker + Docker Compose on the VPS if not already present.

2. **Create the env files by hand.** `docker/.env` and `backend/.env` are both gitignored on purpose (they hold real passwords/secrets), so cloning or pulling never brings them along — you create them once, directly on the server:
   ```bash
   cp docker/.env.example docker/.env    # set real MySQL passwords
   cp backend/.env.example backend/.env  # set real DATABASE_URL, JWT_SECRET, etc.
   ```

3. **Set `NODE_ENV=production` in `backend/.env`.** This one line matters a lot: [bootstrapSecrets.js](backend/src/config/bootstrapSecrets.js) only fetches secrets from Azure Key Vault when `NODE_ENV=production`. Leave it as `development` and the app quietly falls back to whatever's typed into `backend/.env` instead — which is exactly what the course requirements forbid ("must NOT use local `.env` files for production secrets", see [docs/req.md](docs/req.md)). To make this hard to get wrong, `deploy.sh` checks this value first and refuses to deploy if it isn't set correctly.

4. **Point Nginx at the containers.** Add the rules in [nginx/project-location.conf](nginx/project-location.conf) inside the VPS's existing Nginx `server {}` block, so requests to `/project/...` reach the frontend and backend containers without disturbing the site's other paths (e.g. `/content`, `/api`).

### Every deploy after that

Once the server is set up, shipping a new change is just:

```bash
./deploy.sh
```

This pulls the latest `main`, rebuilds the Docker images, and restarts the containers with `docker compose up -d --build`.

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
