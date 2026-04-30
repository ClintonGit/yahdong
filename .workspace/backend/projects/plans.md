# Backend/Projects — Plans
> Updated: 2026-04-30

## Overview
CRUD projects + member management per project

## Backlog Summary
| REQ | Description | Status |
|-----|-------------|--------|
| REQ-001 | GET /projects — list projects ที่ user เป็น member | Backlog |
| REQ-002 | POST /projects — create project, creator เป็น owner อัตโนมัติ | Backlog |
| REQ-003 | GET /projects/:id — project detail + members | Backlog |
| REQ-004 | PATCH /projects/:id — update name/desc/color (owner only) | Backlog |
| REQ-005 | DELETE /projects/:id — soft delete (owner only) | Backlog |
| REQ-006 | POST /projects/:id/members — invite member (owner/admin) | Backlog |
| REQ-007 | PATCH /projects/:id/members/:userId — change role | Backlog |
| REQ-008 | DELETE /projects/:id/members/:userId — remove member | Backlog |
| REQ-009 | ProjectGuard — check membership + role ก่อน access | Backlog |

## Dependencies
- prisma (Project, ProjectMember models)
- JwtAuthGuard, ProjectGuard
