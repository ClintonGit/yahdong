# อย่าดอง (yahdong) — Master Plans
> Updated: 2026-04-30 | Stack locked ✅

## Overview
PM Tool แบบ Trello + Jira ในคอนเซ็ปต์ "Forest World" มาสคอต "ดอง" คาปิบาร่า
Thai-first, self-hosted, open-source

## Architecture
```
Monorepo (npm workspaces)
├── apps/web    → React + Vite  (Frontend)
└── apps/api    → NestJS        (Backend)
```
แยก frontend/backend — scale อิสระ, ทีมทำงานไม่ยุ่งกัน

## Stack
| Layer | Tech | เหตุผล |
|-------|------|--------|
| Frontend | React 19 + Vite + TypeScript | Ecosystem ใหญ่สุด |
| Styling | Tailwind CSS v4 + shadcn/ui | UI สวย, consistent |
| Backend | NestJS + TypeScript | Structured, decorator-based, scalable |
| Database | PostgreSQL 16 | Relational, mature, ฟรี |
| ORM | Prisma ORM | DX ดีที่สุด, Prisma Studio, schema ชัดเจน |
| Auth | JWT + Passport.js (NestJS) | Access + Refresh token |
| Animation | GSAP + dotLottie + CSS | Forest UI |
| Monorepo | npm workspaces | เรียบง่าย |
| Deploy | Docker Compose | 3 services: web + api + db |

## Project Structure
```
yahdong/
├── apps/
│   ├── web/              ← React + Vite
│   └── api/              ← NestJS
├── packages/
│   └── shared/           ← TypeScript types ร่วมกัน
├── .workspace/
├── docker-compose.yml
└── package.json          ← npm workspaces root
```

## Systems
| System | Description | Status |
|--------|-------------|--------|
| `frontend` | React UI, forest theme, kanban | 🔲 Backlog |
| `backend` | NestJS API, DB schema | 🔲 Backlog |
| `infra` | Docker Compose, PostgreSQL | 🔄 In Progress |

## Phases

### Phase 1 — Foundation (MVP)
- [x] Monorepo setup (npm workspaces + shared types) — React 19, NestJS 11, Vite 8
- [x] Infra: Docker Compose (web + api + db)
- [ ] Backend: DB schema + Prisma migrations
- [ ] Backend: Auth (register/login/JWT)
- [ ] Backend: Projects CRUD
- [ ] Backend: Tasks CRUD + Kanban statuses
- [ ] Frontend: Auth pages (login/register)
- [ ] Frontend: Project dashboard
- [ ] Frontend: Kanban board + drag & drop
- [ ] Frontend: Forest UI base theme + ดอง mascot

### Phase 2 — Core PM Features
- [ ] Backend: Sprints API
- [ ] Backend: Multi-user + roles (Owner/Member/Viewer)
- [ ] Backend: WebSocket Gateway (real-time)
- [ ] Frontend: Sprint planning + Backlog
- [ ] Frontend: Boss View (executive dashboard)
- [ ] Frontend: My Day (cross-project personal view)
- [ ] Frontend: ดอง Lottie animations + messages

### Phase 3 — Forest World
- [ ] Forest parallax layers + health system
- [ ] Micro-interactions (complete task = flower bloom)
- [ ] Professional Mode + Focus Mode toggle
- [ ] Time-of-day theme (dawn/day/dusk/night)

## Design Tokens
- Primary: `#E8A030` (ส้มแสงแดด)
- Forest Green: `#4A7C5E`
- Wood Brown: `#C8956A`
- Ground: `#2D4A2D`
- Text: `#1A0F00`
- Font: IBM Plex Sans Thai + Kodchasan
