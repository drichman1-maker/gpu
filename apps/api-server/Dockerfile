FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
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
RUN pnpm install

# Build stage
FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY package.json pnpm-workspace.yaml tsconfig.json ./
COPY scripts ./scripts

# Build all packages in dependency order
RUN pnpm --filter @gpuwatch/domain build
RUN pnpm --filter @gpuwatch/infra build
RUN pnpm --filter @gpuwatch/charts build
RUN pnpm --filter @gpuwatch/notif build
RUN pnpm --filter api-server build

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
COPY --from=builder --chown=apiuser:nodejs /app/packages/domain/dist ./packages/domain/dist
COPY --from=builder --chown=apiuser:nodejs /app/packages/domain/package.json ./packages/domain/
COPY --from=builder --chown=apiuser:nodejs /app/packages/infra/dist ./packages/infra/dist
COPY --from=builder --chown=apiuser:nodejs /app/packages/infra/package.json ./packages/infra/
COPY --from=builder --chown=apiuser:nodejs /app/packages/notif/dist ./packages/notif/dist
COPY --from=builder --chown=apiuser:nodejs /app/packages/notif/package.json ./packages/notif/

USER apiuser

EXPOSE 8080

CMD ["node", "dist/index.js"]
