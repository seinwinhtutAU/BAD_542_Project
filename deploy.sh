#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# This script is for the VPS, not local dev — it pulls from origin and rebuilds
# the production stack, which must fetch its secrets from Azure Key Vault rather
# than trust whatever is sitting in backend/.env.
if [ ! -f backend/.env ]; then
  echo "Error: backend/.env not found. Create it on the server before deploying." >&2
  exit 1
fi

if ! grep -qE '^NODE_ENV=production$' backend/.env; then
  echo "Error: backend/.env must set NODE_ENV=production (required to fetch secrets from Azure Key Vault instead of local .env). Refusing to deploy." >&2
  exit 1
fi

git pull origin main
docker compose -f docker/docker-compose.yml up -d --build

echo "Deployed. Running containers:"
docker compose -f docker/docker-compose.yml ps
