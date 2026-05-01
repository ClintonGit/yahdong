# Build context: monorepo root
# docker build -f yahdong-webapp/Dockerfile --build-arg VITE_API_URL=https://yahdong-api.commsk.dev .

FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY yahdong-api/package*.json ./yahdong-api/
COPY yahdong-webapp/package*.json ./yahdong-webapp/
# npm install (not ci) so platform-specific optional deps resolve for linux
RUN npm install --prefer-offline 2>/dev/null || npm install

COPY yahdong-webapp ./yahdong-webapp

ARG VITE_API_URL=https://yahdong-api.commsk.dev
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build:web

# ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/yahdong-webapp/dist /usr/share/nginx/html
COPY yahdong-webapp/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
