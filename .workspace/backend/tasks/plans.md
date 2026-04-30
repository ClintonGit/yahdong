# Backend/Tasks — Plans
> Updated: 2026-04-30

## Overview
CRUD tasks + kanban status management + drag & drop reorder

## Backlog Summary
| REQ | Description | Status |
|-----|-------------|--------|
| REQ-001 | GET /projects/:id/tasks — list tasks พร้อม status, assignee | Backlog |
| REQ-002 | POST /projects/:id/tasks — create task | Backlog |
| REQ-003 | GET /tasks/:id — task detail | Backlog |
| REQ-004 | PATCH /tasks/:id — update title/desc/priority/assignee/due_date | Backlog |
| REQ-005 | DELETE /tasks/:id — delete task | Backlog |
| REQ-006 | PATCH /tasks/:id/move — เปลี่ยน status + reorder (drag & drop) | Backlog |
| REQ-007 | GET /projects/:id/statuses — list kanban columns | Backlog |
| REQ-008 | POST /projects/:id/statuses — create column | Backlog |
| REQ-009 | PATCH /statuses/:id — rename/recolor column | Backlog |
| REQ-010 | DELETE /statuses/:id — delete column (ย้าย tasks ไป default ก่อน) | Backlog |

## Dependencies
- prisma (Task, TaskStatus models)
- JwtAuthGuard, ProjectGuard
