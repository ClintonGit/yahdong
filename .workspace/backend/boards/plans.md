# Backend/Boards — Plans
> Updated: 2026-04-30

## Overview
Kanban board config per project — default statuses seed เมื่อสร้าง project

## Backlog Summary
| REQ | Description | Status |
|-----|-------------|--------|
| REQ-001 | seed default statuses เมื่อ create project: Backlog / In Progress / Done | Backlog |
| REQ-002 | PATCH /projects/:id/statuses/reorder — drag & drop column reorder | Backlog |

## Dependencies
- prisma (TaskStatus model)
- Projects module (hook on project create)
