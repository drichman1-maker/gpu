FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/infra/package.json ./packages/infra/
COPY packages/charts/package.json ./packages/charts/
COPY packages/notif/package.json ./packages/notif/
COPY apps/api-server/package.json ./apps/api-server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build all packages
RUN pnpm --filter @gpuwatch/domain build
RUN pnpm --filter @gpuwatch/infra build
RUN pnpm --filter @gpuwatch/charts build
RUN pnpm --filter @gpuwatch/notif build
RUN pnpm --filter @gpuwatch/api-server build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# Copy built files
COPY --from=builder --chown=apiuser:nodejs /app/apps/api-server/dist ./dist
COPY --from=builder --chown=apiuser:nodejs /app/apps/api-server/package.json ./
COPY --from=builder --chown=apiuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=apiuser:nodejs /app/packages ./packages

USER apiuser

EXPOSE 8080

CMD ["node", "dist/index.js"]
