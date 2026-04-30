# Infra — Plans
> Updated: 2026-04-30

## Overview
Docker Compose — self-hosted, `docker compose up` แล้วใช้ได้เลย

## Goals
- 3 services: web (React) + api (NestJS) + db (PostgreSQL)
- Auto migration on api startup
- .env based config
- Easy backup

## Modules
| Module | Description | Phase | Status |
|--------|-------------|-------|--------|
| `docker` | Dockerfiles + docker-compose.yml | 1 | ✅ Done |
| `database` | PostgreSQL init + Drizzle migrate | 1 | 🔲 Backlog |
| `env` | .env.example, validation | 1 | ✅ Done |

## Services (docker-compose)
```yaml
services:
  web:    # React + Vite (nginx, port 80)
  api:    # NestJS (port 3001)
  db:     # PostgreSQL 16 (port 5432)
  # Phase 2
  redis:  # session cache / queue (port 6379)
```

## Target
- web image:  < 50MB  (nginx + static build)
- api image:  < 200MB (node + nestjs)
- Cold start: < 15s
- RAM idle:   < 512MB total
