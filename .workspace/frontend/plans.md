# Frontend — Plans
> Updated: 2026-04-30

## Overview
React 19 + Vite + TypeScript — Forest World UI + Capybara mascot "ดอง"

## Goals
- Kanban board ที่ใช้งานได้จริง, drag & drop
- Forest visual theme (UI อยู่ใน world ของดอง)
- Boss View + Dev View (role-aware interface)
- My Day — cross-project personal dashboard
- Professional Mode + Focus Mode toggle

## Modules
| Module | Description | Phase | Status |
|--------|-------------|-------|--------|
| `auth` | Login / Register pages | 1 | 🔲 Backlog |
| `layout` | App shell, sidebar, navigation | 1 | 🔲 Backlog |
| `project` | Project list, create, settings | 1 | 🔲 Backlog |
| `kanban` | Kanban board + drag & drop | 1 | 🔲 Backlog |
| `forest-ui` | Forest theme, tokens, components | 1 | 🔲 Backlog |
| `sprint` | Sprint planning, backlog | 2 | 🔲 Backlog |
| `my-day` | Cross-project personal view | 2 | 🔲 Backlog |
| `boss-view` | Executive dashboard | 2 | 🔲 Backlog |
| `dong-mascot` | ดอง Lottie animations + messages | 2 | 🔲 Backlog |
| `forest-world` | Parallax, health system, interactions | 3 | 🔲 Backlog |

## Dependencies
```
react, react-dom, react-router-dom
tailwindcss v4
@shadcn/ui
@dnd-kit/core, @dnd-kit/sortable    ← kanban drag & drop
@lottiefiles/dotlottie-react        ← ดอง animation
gsap                                ← forest parallax
axios                               ← API calls
zustand                             ← client state management
@tanstack/react-query               ← server state (cache, loading, refetch)
react-hook-form + zod               ← form validation
```
