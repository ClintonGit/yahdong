# Frontend/Kanban — Plans
> Updated: 2026-04-30

## Overview
Kanban board — columns, task cards, drag & drop, task detail modal

## Backlog Summary
| REQ | Description | Status |
|-----|-------------|--------|
| REQ-001 | KanbanBoard — render columns + tasks from API | Backlog |
| REQ-002 | KanbanColumn component — header, task list, add task button | Backlog |
| REQ-003 | TaskCard component — title, priority badge, assignee avatar, due date | Backlog |
| REQ-004 | Drag & drop task — move between columns (@dnd-kit) | Backlog |
| REQ-005 | Drag & drop column — reorder columns (@dnd-kit) | Backlog |
| REQ-006 | Task detail modal — view/edit all fields | Backlog |
| REQ-007 | Create task inline — quick add ใต้ column | Backlog |
| REQ-008 | Optimistic update — drag ไม่รอ API response | Backlog |

## Dependencies
- @dnd-kit/core, @dnd-kit/sortable
- @tanstack/react-query (useTasks, useMoveTask)
- shadcn/ui (Dialog, Badge, Avatar)
