# Backend/Users — Plans
> Updated: 2026-04-30

## Overview
User profile management — ดู/แก้ไข profile, avatar

## Backlog Summary
| REQ | Description | Status |
|-----|-------------|--------|
| REQ-001 | GET /users/me — return current user profile | Backlog |
| REQ-002 | PATCH /users/me — update name, avatar | Backlog |
| REQ-003 | GET /users/:id — public profile (name, avatar) | Backlog |

## Dependencies
- prisma (User model)
- JwtAuthGuard
