FROM node:20-alpine

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm tsx

# Copy all files
COPY . .

# Install dependencies
RUN pnpm install

# Don't build - run with tsx in production
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npx", "tsx", "apps/api-server/src/index.ts"]
