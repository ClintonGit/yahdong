# Backend — Plans
> Updated: 2026-04-30

## Overview
NestJS + TypeScript + Prisma ORM + PostgreSQL

## Goals
- Multi-project, multi-user PM API
- JWT Auth (Access + Refresh token)
- Role-based permissions per project (Owner/Member/Viewer)
- WebSocket Gateway สำหรับ real-time (Phase 2)

## Modules
| Module | Description | Phase | Status |
|--------|-------------|-------|--------|
| `auth` | Register, login, JWT, refresh token | 1 | 🔲 Backlog |
| `users` | User profile, avatar | 1 | 🔲 Backlog |
| `projects` | CRUD projects + members | 1 | 🔲 Backlog |
| `tasks` | CRUD tasks, status, priority, assignee | 1 | 🔲 Backlog |
| `boards` | Kanban column config per project | 1 | 🔲 Backlog |
| `sprints` | Sprint CRUD, task assignment | 2 | 🔲 Backlog |
| `notifications` | ดอง messages, overdue triggers | 2 | 🔲 Backlog |
| `gateway` | WebSocket real-time events | 2 | 🔲 Backlog |

## DB Schema (Core Tables)
```
users           → id, name, email, password_hash, avatar, created_at
organizations   → id, name, slug, created_at
org_members     → org_id, user_id, role (owner/admin/member)
projects        → id, org_id, name, slug, description, color
project_members → project_id, user_id, role (owner/member/viewer)
task_statuses   → id, project_id, name, color, order
tasks           → id, project_id, title, description, status_id,
                  priority, assignee_id, sprint_id, due_date,
                  order, created_by, created_at
sprints         → id, project_id, name, start_date, end_date, status
comments        → id, task_id, user_id, body, created_at
activity_log    → id, task_id, user_id, action, meta, created_at
```

## API Structure
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
DELETE /auth/logout

GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id

GET    /projects/:id/tasks
POST   /projects/:id/tasks
PATCH  /tasks/:id
DELETE /tasks/:id
PATCH  /tasks/:id/move      ← drag & drop reorder

GET    /projects/:id/sprints
POST   /projects/:id/sprints
PATCH  /sprints/:id
```

## Dependencies
```
@nestjs/core, @nestjs/common, @nestjs/platform-express
@nestjs/jwt, @nestjs/passport, passport, passport-jwt
@nestjs/websockets, @nestjs/platform-socket.io
prisma
@prisma/client
bcryptjs
class-validator, class-transformer
zod
```
