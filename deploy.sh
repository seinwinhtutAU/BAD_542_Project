#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

git pull origin main
docker compose -f docker/docker-compose.yml up -d --build

echo "Deployed. Running containers:"
docker compose -f docker/docker-compose.yml ps
