# TailTracker Web App Dockerfile
# Multi-stage build for development and production
# Updated: 2025-12-29

# ===========================================
# Base Stage - Install dependencies
# ===========================================
FROM node:24-slim AS base

# Labels for container metadata
LABEL org.opencontainers.image.title="TailTracker Web App"
LABEL org.opencontainers.image.description="TailTracker user-facing web application"
LABEL org.opencontainers.image.vendor="TailTracker"
LABEL org.opencontainers.image.version="1.2.0"
LABEL com.tailtracker.service="web"

# Install pnpm globally (v10.x for better performance and security)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY turbo.json tsconfig.base.json ./

# Copy shared packages (dependencies for web app)
COPY packages/ ./packages/

# Copy web app
COPY apps/web/ ./apps/web/

# Install all dependencies with frozen lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ===========================================
# Build Stage - Build the application
# ===========================================
FROM base AS builder

# Build all packages with turbo (handles dependency order)
RUN pnpm turbo build --filter="@tailtracker/web"

# ===========================================
# Development Stage - Hot reload server
# ===========================================
FROM node:24-slim AS development

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

WORKDIR /app

# Copy from base (includes node_modules)
COPY --from=base /app ./

# Set working directory to web app
WORKDIR /app/apps/web

# Environment
ENV NODE_ENV=development
ENV VITE_APP_ENV=development

# Expose Vite dev server port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000 || exit 1

# Start development server
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "4000"]

# ===========================================
# Production Stage - Nginx static server
# ===========================================
FROM nginx:1.28.1-alpine AS production

# Labels
LABEL org.opencontainers.image.title="TailTracker Web App"
LABEL org.opencontainers.image.description="TailTracker user-facing web application"
LABEL org.opencontainers.image.vendor="TailTracker"
LABEL com.tailtracker.service="web"

# Copy built assets from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Add non-root user for security
RUN addgroup -g 1001 -S tailtracker && \
    adduser -S tailtracker -u 1001 -G tailtracker && \
    chown -R tailtracker:tailtracker /usr/share/nginx/html && \
    chown -R tailtracker:tailtracker /var/cache/nginx && \
    chown -R tailtracker:tailtracker /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R tailtracker:tailtracker /var/run/nginx.pid

USER tailtracker

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
