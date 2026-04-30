# Infra/Docker — Plans
> Updated: 2026-04-30

## Overview
Dockerfiles + docker-compose.yml สำหรับ 3 services

## Backlog Summary
| REQ | Description | Status |
|-----|-------------|--------|
| REQ-001 | Dockerfile สำหรับ api (multi-stage, node:20-alpine) | ✅ Done |
| REQ-002 | Dockerfile สำหรับ web (multi-stage, nginx:alpine) | ✅ Done |
| REQ-003 | docker-compose.yml — web + api + db + healthcheck | ✅ Done |
| REQ-004 | nginx.conf — SPA routing + proxy /api/ | ✅ Done |

## Dependencies
- Docker Desktop
- docker-compose v2
