# GPUWatch — Deployment Guide

## Stack Overview

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend | **Vercel** | Next.js App Router, ISR, Edge |
| API Workers | **Railway** | BullMQ workers, Node 20 |
| Database | **Supabase** | Postgres 16 + TimescaleDB |
| Cache | **Railway Redis** | ioredis, key-value cache |
| Email | **Resend** | Price alert emails |
| Errors | **Sentry** | Optional, backend workers |

---

## 1. Database Setup (Supabase)

```bash
# 1. Create project at supabase.com
# 2. Enable TimescaleDB extension in Dashboard → Extensions → timescaledb
# 3. Run the schema:
psql "$DATABASE_URL" -f database/schema.sql
# 4. Seed GPU data:
pnpm db:seed
```

Get your connection string from **Project → Settings → Database → Connection string (URI mode)**.

> Add `?sslmode=require` to the URI if connecting from outside Supabase.

---

## 2. Redis (Railway)

1. In Railway dashboard → **New** → **Add Redis**
2. Copy the `REDIS_URL` from the service's **Variables** tab

---

## 3. Environment Variables

Copy `.env.example` → `.env` and fill in:

```bash
# Required for everything
DATABASE_URL=postgresql://...

# Required for workers
REDIS_URL=redis://...
BESTBUY_API_KEY=...
RESEND_API_KEY=...

# Required for admin
ADMIN_KEY=...            # Any secret string — used to protect /admin

# Optional but recommended
SENTRY_DSN=...
NEXT_PUBLIC_APP_URL=https://gpuwatch.io
```

---

## 4. Deploy Frontend (Vercel)

```bash
# Push to GitHub, then connect repo in Vercel dashboard
# Or use CLI:
npx vercel --prod

# Environment variables to add in Vercel Dashboard:
DATABASE_URL
REDIS_URL
RESEND_API_KEY
ADMIN_KEY
NEXT_PUBLIC_APP_URL
```

Vercel auto-detects Next.js. Set **Root Directory** to `apps/frontend`.

**ISR revalidation** is configured at route level:
- Homepage: 60s
- GPU detail pages: 60s  
- SEO pages: 300s

---

## 5. Deploy API Workers (Railway)

```bash
# 1. Connect GitHub repo to Railway
# 2. New Service → Deploy from repo → Root: apps/api-server
# 3. Set Start Command:
node --loader ts-node/esm src/index.ts

# Or build first and run compiled output:
# Build: pnpm build
# Start: node dist/index.js
```

Set all environment variables in Railway → Service → Variables.

**Tip:** Railway auto-restarts crashed workers. For production, add a healthcheck endpoint.

---

## 6. Cron Schedule (Vercel or Railway)

The BullMQ schedulers are self-managing once the api-server starts:

| Job | Frequency | Notes |
|-----|-----------|-------|
| Best Buy ingest | Every 4h | Products API, rate-limited |
| Amazon ingest | Every 6h | PA API v5 |
| Scraper ingest | Every 8h | Newegg + B&H HTML |
| Deal scoring | After each ingest | Automatic via queue |

No external cron needed — workers schedule themselves via BullMQ `repeat`.

---

## 7. DNS & Affiliate Tracking

The `/out/[gpu]/[retailer]` route logs each click to `outbound_clicks` before redirecting.

Add this rewrite rule in Vercel if needed:
```json
{ "source": "/out/:gpu/:retailer", "destination": "/out/:gpu/:retailer" }
```

---

## 8. Post-Deploy Checklist

- [ ] Run `pnpm db:seed` to populate GPU catalog
- [ ] Add Best Buy API key and test one ingest run manually
- [ ] Add Resend domain & FROM address
- [ ] Set `ADMIN_KEY` and verify `/admin?key=YOUR_KEY` loads
- [ ] Set up Amazon PA API credentials and populate ASIN map
- [ ] Verify a GPU page at `/gpu/rtx-5090` renders (data arrives after first ingest)
- [ ] Subscribe to your own email alert and verify email delivery

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start all services (requires local Postgres + Redis)
pnpm dev

# Or run individual services:
pnpm --filter @gpuwatch/frontend dev       # Next.js on :3000
pnpm --filter @gpuwatch/api-server dev     # BullMQ workers

# Seed the database
pnpm db:seed
```

---

## 90-Day Roadmap

| Month | Milestone |
|-------|-----------|
| **Month 1** | Launch with 12 GPUs live, alert system active, 4 retailers ingesting |
| **Month 2** | Add `/gpu/[model]/vs/[other]` comparison pages, expand to 30+ GPUs |
| **Month 3** | Launch programmatic SEO for 50+ price tier combinations, add Micro Center scraper, hit 10k monthly organic searches |

**Key levers:**
- Every GPU model page = Google-indexable with JSON-LD product schema
- `/best-gpu-under-$X` pages target navigational and buy-intent queries
- Price history chart = dwell time signal (users interact with it)
- Affiliate click revenue scales automatically with traffic
