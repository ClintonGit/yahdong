# Backend/Auth — Plans
> Updated: 2026-04-30

## Overview
JWT-based authentication — register, login, refresh token, logout

## Backlog Summary
| REQ | Description | Status |
|-----|-------------|--------|
| REQ-001 | POST /auth/register — สร้าง user ใหม่, hash password | Backlog |
| REQ-002 | POST /auth/login — verify password, return access + refresh token | Backlog |
| REQ-003 | POST /auth/refresh — รับ refresh token, return access token ใหม่ | Backlog |
| REQ-004 | DELETE /auth/logout — revoke refresh token | Backlog |
| REQ-005 | JwtAuthGuard — protect routes ด้วย Bearer token | Backlog |
| REQ-006 | CurrentUser decorator — ดึง user จาก JWT payload | Backlog |

## Dependencies
- prisma (User model)
- bcryptjs (password hash)
- @nestjs/jwt, @nestjs/passport, passport-jwt
- @nestjs/config (JWT_SECRET, expires)
