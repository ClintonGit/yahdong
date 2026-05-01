# Build context: monorepo root
# docker build -f yahdong-api/Dockerfile .

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY yahdong-api/package*.json ./yahdong-api/
COPY yahdong-webapp/package*.json ./yahdong-webapp/
RUN npm ci

COPY yahdong-api/prisma ./yahdong-api/prisma
COPY yahdong-api/prisma.config.ts ./yahdong-api/
RUN cd yahdong-api && npx prisma generate

COPY yahdong-api/tsconfig*.json ./yahdong-api/
COPY yahdong-api/src ./yahdong-api/src
RUN npm run build:api

# ──────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY package*.json ./
COPY yahdong-api/package*.json ./yahdong-api/
COPY yahdong-webapp/package*.json ./yahdong-webapp/
RUN npm ci --omit=dev

COPY yahdong-api/prisma ./yahdong-api/prisma
COPY yahdong-api/prisma.config.ts ./yahdong-api/
RUN cd yahdong-api && npx prisma generate

COPY --from=builder /app/yahdong-api/dist ./yahdong-api/dist

ENV PATH="/app/node_modules/.bin:$PATH"
USER app
WORKDIR /app/yahdong-api
EXPOSE 3001
CMD ["sh", "-c", "prisma migrate deploy && node dist/main.js"]
