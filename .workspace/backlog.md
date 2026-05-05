# อย่าดอง — Master Backlog
> Updated: 2026-05-06 | Stack locked ✅

---

## 🌿 Platform Vision

Thai-first Project Management Platform แนว "Forest World" — มาสคอต **ดอง** คาปิบาร่าเป็น companion คอยช่วย track งาน แจ้งเตือน และสะท้อนสุขภาพทีม
เป้าหมาย: **Trello + Jira + ดอง** สำหรับทีมไทย — self-hostable, open-core, Thai culture-first

---

## ✅ Done (Deployed)

- Monorepo NestJS + React, deploy บน `yahdong.commsk.dev` / `yahdong-api.commsk.dev`
- Auth: register / login / JWT access+refresh / persist session
- Projects CRUD + multi-project
- Kanban board + drag & drop (@dnd-kit) + column management
- Task CRUD + TaskDetailModal + due date + priority + assignee
- ดอง mascot — sidebar context-aware, login page, toast system
- Comments + WebP image upload
- Card Cover Image (task.coverImage + coverColor)
- **Dong Toast System** — dong-02 overdue, dong-03 done, dong-04 new project, dong-06 all-clear overlay
- **Custom DatePicker** — Popover+Calendar+Thai locale+พ.ศ.+clearable + quick shortcuts (วันนี้/พรุ่งนี้/อาทิตย์หน้า/2 สัปดาห์)
- **PWA** — vite-plugin-pwa + Workbox NetworkFirst API + CacheFirst images + install prompt
- Email notifications (task assigned, project invite)
- CI/CD: GitHub Actions → Docker → self-hosted

---

## 🗂️ Schema — Current State (2026-05-06)

```
✅ Deployed
  User, Organization, OrgMember
  Project (isPublic, shareToken ✅), ProjectMember (starred ✅)
  Task (coverImage ✅, coverColor ✅), TaskStatus
  Comment (imageUrl ✅), RefreshToken
  ProjectInvite (token, email, role, expiresAt) ✅

🔲 Migration Pending (20260506110000_labels_checklist)
  Label           — projectId, name, color
  TaskLabel       — taskId × labelId (M:M)
  ChecklistItem   — taskId, text, checked, order

🔲 Future Sprints
  CommentMention, RecurringTaskTemplate
  UserNotificationAccount, ProjectNotificationChannel
  ActivityLog, TimeEntry, Sprint
```

---

## 📐 Custom UI Components Policy
> **ห้ามใช้ raw HTML form elements ใดๆ** — ทุก component ต้องใช้ shadcn/ui หรือ custom Forest World component

| Raw HTML | ❌ | ✅ ใช้แทน |
|----------|---|----------|
| `<input type="text">` | ❌ | `<Input>` (shadcn) |
| `<input type="date">` | ❌ | `<DatePicker>` (custom ✅ done) |
| `<input type="color">` | ❌ | `<ColorPicker>` (custom) |
| `<input type="checkbox">` | ❌ | `<Checkbox>` (shadcn) |
| `<select>` | ❌ | `<Select>` (shadcn) |
| `<textarea>` | ❌ | `<Textarea>` (shadcn) |

---

## 🚀 Now Implementing (Sprint 1.5 — Wave 2)

### Backend APIs

| ID | Endpoint | Notes | Status |
|----|----------|-------|--------|
| BE-L01 | `GET /projects/:id/labels` | list labels | 🔲 |
| BE-L02 | `POST /projects/:id/labels` | create label | 🔲 |
| BE-L03 | `PATCH /labels/:id` | rename/recolor | 🔲 |
| BE-L04 | `DELETE /labels/:id` | delete label | 🔲 |
| BE-L05 | `PATCH /tasks/:id/labels` | set labels (replace array) | 🔲 |
| BE-CL01 | `GET /tasks/:id/checklist` | list items | 🔲 |
| BE-CL02 | `POST /tasks/:id/checklist` | add item | 🔲 |
| BE-CL03 | `PATCH /checklist/:id` | check/rename | 🔲 |
| BE-CL04 | `DELETE /checklist/:id` | delete item | 🔲 |
| BE-M01 | `GET /projects/:id/members` | member list (for assignee picker) | 🔲 |
| BE-INV01 | `POST /projects/:id/invite-link` | generate token (no email required) | 🔲 |
| BE-INV02 | `GET /invite/:token` | validate token (public) | 🔲 |
| BE-INV03 | `POST /invite/:token/accept` | accept (authenticated) | 🔲 |
| BE-SH01 | `PATCH /projects/:id/share` | toggle isPublic + generate shareToken | 🔲 |
| BE-SH02 | `GET /b/:shareToken` | public read-only board | 🔲 |
| BE-ST01 | `PATCH /projects/:id/star` | toggle starred for current user | 🔲 |

### Frontend

| ID | Feature | Component | Status |
|----|---------|-----------|--------|
| FE-L01 | Label chips on TaskCard | TaskCard.tsx | 🔲 |
| FE-L02 | Label picker in TaskDetailModal | LabelPicker.tsx | 🔲 |
| FE-L03 | Label management (create/rename/delete) | TaskDetailModal.tsx | 🔲 |
| FE-CL01 | Checklist section in TaskDetailModal | ChecklistSection.tsx | 🔲 |
| FE-CL02 | Add item + check/uncheck + delete + progress bar | ChecklistSection.tsx | 🔲 |
| FE-AS01 | Assignee picker (member dropdown) | AssigneePicker.tsx | 🔲 |
| FE-CV01 | Color cover picker (Forest palette swatches) | TaskDetailModal.tsx | 🔲 |
| FE-ST01 | Star/favorite on sidebar (hover star icon) | Sidebar.tsx | 🔲 |
| FE-ST02 | Starred projects section at top of sidebar | Sidebar.tsx | 🔲 |
| FE-SH01 | Share button → generate link modal | BoardPage.tsx | 🔲 |
| FE-SH02 | Public read-only board `/b/:shareToken` | PublicBoardPage.tsx | 🔲 |
| FE-INV01 | Accept invite page `/invite/:token` | AcceptInvitePage.tsx | 🔲 |
| FE-MOB01 | Mobile responsive: Sidebar → drawer | Sidebar.tsx | 🔲 |
| FE-MOB02 | Mobile: Modal → fullscreen sheet | TaskDetailModal.tsx | 🔲 |
| FE-MOB03 | Mobile: Board → horizontal scroll per column | KanbanBoard.tsx | 🔲 |
| FE-MOB04 | TouchSensor for dnd-kit | KanbanBoard.tsx | 🔲 |

---

## 🟡 Sprint 2 — Comments (Polish) + Auth + Labels + Checklist (48 pts)

> **Goal:** Labels + checklist ใน task detail, assignee picker, Google OAuth, invite link flow

### Completed this sprint (to commit)
- [x] PWA — install prompt, offline caching
- [x] DatePicker — Thai shortcuts
- [x] Card Cover Image + dong sticker UX moments
- [x] Dong Toast System (overdue/done/newProject/allClear)
- [x] Schema — starred, coverColor, isPublic, shareToken, ProjectInvite
- [x] Labels + TaskLabel + ChecklistItem added to schema

### Backend (Sprint 2)
| ID | Story | Pts | Status |
|----|-------|-----|--------|
| BE-L01–L05 | Labels CRUD + PATCH task labels | 8 | 🔲 |
| BE-CL01–CL04 | Checklist CRUD | 6 | 🔲 |
| BE-M01 | GET members for assignee picker | 2 | 🔲 |
| BE-INV01–03 | Invite link (no email needed) | 6 | 🔲 |
| BE-SH01–02 | Public share board | 5 | 🔲 |
| BE-ST01 | Star/unstar project | 2 | 🔲 |
| BE-G01 | Google OAuth (passport-google-oauth20) | 5 | 🔲 |

### Frontend (Sprint 2)
| ID | Story | Pts | Status |
|----|-------|-----|--------|
| FE-L01–L03 | Labels UI | 8 | 🔲 |
| FE-CL01–CL02 | Checklist UI | 6 | 🔲 |
| FE-AS01 | Assignee picker | 3 | 🔲 |
| FE-CV01 | Color cover picker | 3 | 🔲 |
| FE-ST01–02 | Starred sidebar section | 3 | 🔲 |
| FE-SH01–02 | Share + public board | 5 | 🔲 |
| FE-INV01 | Accept invite page | 3 | 🔲 |
| FE-G01 | Google OAuth button | 3 | 🔲 |
| FE-MOB01–04 | Mobile responsive | 8 | 🔲 |

**Sprint 2 Total: ~75 pts** (ทยอยทำ multi-wave)

---

## 🔵 Sprint 3 — Thai Culture + Notifications + Viral (45 pts)

> **Goal:** พ.ศ. toggle, Discord/Telegram bots, invite virality, public board

### Thai-first Features
| ID | Story | Pts |
|----|-------|-----|
| FE-TH01 | พ.ศ. toggle (dayjs buddhistEra) + settings context | 5 |
| FE-TH02 | Thai public holidays auto-block (ical feed parse) | 8 |
| FE-TH03 | "เลิกงาน" button → notify ทีม (work-life signal) | 3 |

### Notification Platform
| ID | Story | Pts |
|----|-------|-----|
| BE-E01 | EmailModule — nodemailer + SMTP ENV | 3 |
| BE-E02-04 | Templates: assigned / mention / digest (Thai) | 5 |
| BE-N01 | Discord Bot: setup + project channel | 5 |
| BE-N02 | Telegram Bot (telegraf) | 5 |
| BE-N03 | NotificationService abstract layer | 3 |

### Viral / Sharing
| ID | Story | Pts |
|----|-------|-----|
| FE-V01 | Template marketplace — "copy this board" | 8 |
| FE-V02 | Board share card (OG image gen) | 5 |

**Sprint 3 Total: 50 pts**

---

## 🟣 Sprint 4 — Boss View + AI + Time Tracking (38 pts)

> **Goal:** ให้บอส/client ดู progress ได้, AI ช่วย breakdown งาน, track เวลา, audit trail

| ID | Story | Pts |
|----|-------|-----|
| BE-A01-03 | ActivityLog model + feed | 7 |
| BE-TT01-03 | TimeEntry model + timer API + report | 8 |
| BE-SP01-02 | Sprint model + CRUD | 5 |
| BE-F01 | Filter: assignee/priority/due | 2 |
| FE-AI01 | AI Breakdown button → call API → insert subtasks | 5 |
| FE-TT01 | Timer widget in TaskDetailModal | 5 |
| FE-F01 | Filter bar on KanbanBoard | 5 |
| FE-AL01 | Activity Feed in TaskDetailModal | 3 |

**Sprint 4 Total: 40 pts**

---

## 💜 Phase 2 — Forest World + Enterprise (Icebox)

| ID | Feature | Priority |
|----|---------|----------|
| FE-FW01 | Living Forest Burnout Meter (task density → sky/tree state) | HIGH |
| FE-FW02 | ดอง evolution stages (egg → baby → mature → legend) | HIGH |
| FE-FW03 | Forest parallax background (GSAP) | MED |
| FE-FW04 | Professional Mode toggle | MED |
| FE-FW05 | Time-of-day theme (dawn/day/dusk/night) | LOW |
| BE-WS01 | WebSocket — real-time presence + live cursor | HIGH |
| BE-Q01 | Bull+Redis queue for notifications | HIGH |
| BE-ENT01 | SSO (SAML/LDAP) + Audit Log SLA | MED |
| BE-ENT02 | Plugin Marketplace (30% rev share) | LOW |

---

## 🏆 Competitive Moats (อาวุธลับ vs Trello/Notion/Linear)

| Moat | Status | Impact |
|------|--------|--------|
| Thai locale first-class (พ.ศ., Thai holidays, Thai UI) | 🔲 partial | HIGH |
| ดอง mascot + Forest World emotional connection | ✅ | HIGH |
| Dong toast UX moments (6 stickers mapped to events) | ✅ | MED |
| Invite link K-factor (share → viral) | 🔲 | HIGH |
| Public board (boss/client can view without account) | 🔲 | HIGH |
| Data lock-in: history + activity log accumulates value | 🔲 | MED |
| SME-specific: invoice/budget task link | Icebox | HIGH |
| "เลิกงาน" work-life culture features | 🔲 Sprint 3 | MED |
| Template marketplace (community boards) | 🔲 Sprint 3 | HIGH |

---

## 💰 Business Model
- **Free**: open-source core, unlimited projects, self-hosted
- **Pro** (฿199/user/เดือน): AI features, Discord/Telegram bot, Boss View, Time Reports, Priority support
- **Enterprise** (฿50K-200K/ปี): SSO, Audit Log SLA, dedicated support, on-premise

---

## 📐 Definition of Done (ทุก ticket)
- [ ] ไม่มี raw HTML form elements — ใช้ custom/shadcn เท่านั้น
- [ ] TypeScript strict — ไม่มี `any` (หรือ comment เหตุผล)
- [ ] Manual test: happy path + error case + empty state
- [ ] Forest theme สอดคล้อง (colors, fonts, ดอง context)
- [ ] ไม่มี console.log ค้างอยู่
- [ ] Prisma generate หลัง schema change

## ⚠️ Risk Register
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Mobile first ไม่ได้ทำ → user drop on mobile | HIGH | Sprint 2 ต้องทำ TouchSensor + responsive |
| Google OAuth ซับซ้อน | MED | ใช้ @nestjs/passport + passport-google-oauth20 |
| Discord Bot guild permission | MED | fallback เป็น DM + doc onboarding |
| MentionInput cursor state | HIGH | fallback ใช้ @tiptap/react |
| SMTP Gmail rate limit | MED | migrate ไป Resend.com |
