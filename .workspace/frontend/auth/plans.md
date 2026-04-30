# Frontend/Auth — Plans
> Updated: 2026-04-30

## Overview
Login + Register pages, token management, protected routes

## Backlog Summary
| REQ | Description | Status |
|-----|-------------|--------|
| REQ-001 | Register page — form + validation + API call | Backlog |
| REQ-002 | Login page — form + validation + API call | Backlog |
| REQ-003 | Auth store (Zustand) — เก็บ user, tokens | Backlog |
| REQ-004 | axios interceptor — attach Bearer token, auto-refresh | Backlog |
| REQ-005 | ProtectedRoute — redirect ถ้าไม่ได้ login | Backlog |
| REQ-006 | Logout — clear store + redirect | Backlog |

## Dependencies
- react-hook-form + zod
- zustand (auth store)
- axios
- react-router-dom
