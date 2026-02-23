# GPUWatch — Fly.io Deployment Guide

## Stack Overview

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend | **Fly.io** | Next.js 14, App Router, Edge |
| API Workers | **Fly.io** | BullMQ workers, Node 20 |
| Database | **Fly Postgres** | Postgres 15 (TimescaleDB compatible) |
| Cache | **Fly Redis** | Upstash-compatible |
| Email | **Resend** | Price alert emails |
| Domain | **gpudrip.com** | Register separately |

---

## Quick Deploy

```bash
# 1. Clone and setup
git clone https://github.com/drichman1-maker/gpu.git gpudrip
cd gpudrip
pnpm install

# 2. Run the deployment script
./scripts/deploy-fly.sh
```

---

## Manual Deployment

### 1. Prerequisites

- [Fly.io account](https://fly.io) with CLI installed
- [Best Buy API key](https://developer.bestbuy.com)
- [Resend account](https://resend.com) for email alerts

### 2. Create Apps

```bash
# Create the apps
flyctl apps create gpudrip-api --org personal
flyctl apps create gpudrip --org personal
```

### 3. Database Setup

```bash
# Create Postgres cluster
flyctl postgres create --name gpudrip-db --region iad --vm-size shared-cpu-1x --volume-size 10

# Attach to API app (sets DATABASE_URL automatically)
flyctl postgres attach gpudrip-db --app gpudrip-api

# Run schema
flyctl ssh console --app gpudrip-api -C "psql \$DATABASE_URL -f database/schema.sql"
```

### 4. Redis Setup

```bash
# Create Redis
flyctl redis create --name gpudrip-redis --region iad --eviction

# Attach to API app
flyctl redis attach gpudrip-redis --app gpudrip-api
```

### 5. Environment Variables

```bash
# API Server secrets
flyctl secrets set --app gpudrip-api \
    BESTBUY_API_KEY="your_key_here" \
    RESEND_API_KEY="re_your_key" \
    RESEND_FROM="alerts@gpudrip.com" \
    ADMIN_KEY="your_admin_secret" \
    NEXT_PUBLIC_APP_URL="https://gpudrip.com" \
    API_SERVER_URL="https://gpudrip-api.fly.dev"

# Frontend secrets  
flyctl secrets set --app gpudrip \
    NEXT_PUBLIC_APP_URL="https://gpudrip.com" \
    API_SERVER_URL="https://gpudrip-api.fly.dev"
```

### 6. Deploy

```bash
# Deploy API
cd apps/api-server
flyctl deploy --remote-only

# Deploy Frontend
cd ../frontend
flyctl deploy --remote-only
```

### 7. Seed Database

```bash
# Seed GPU catalog (22 GPUs)
flying ssh console --app gpudrip-api -C "pnpm db:seed"
```

---

## Domain Setup

### Register gpudrip.com

Buy via your preferred registrar (Namecheap, Cloudflare, etc.)

### Configure DNS

```bash
# Get the Fly app hostname
flyctl status --app gpudrip

# Add CNAME record in your DNS:
# gpudrip.com → <app-name>.fly.dev
# www.gpudrip.com → <app-name>.fly.dev
```

### Add Custom Domain to Fly

```bash
flyctl certs create gpudrip.com --app gpudrip
flyctl certs create www.gpudrip.com --app gpudrip
```

---

## GPU Catalog (22 GPUs)

### NVIDIA RTX 5000 (Blackwell)
- RTX 5090, 5080, 5070 Ti, 5070, 5060 Ti, 5060

### NVIDIA RTX 4000 (Ada Lovelace)
- RTX 4090, 4080 Super, 4080, 4070 Ti Super, 4070 Ti, 4070 Super, 4070, 4060 Ti, 4060

### AMD RX 9000 (RDNA 4)
- RX 9070 XT, RX 9070, RX 9060 XT

### AMD RX 7000 (RDNA 3)
- RX 7900 XTX, RX 7900 XT, RX 7800 XT, RX 7700 XT, RX 7600

---

## Monitoring

```bash
# View logs
flyctl logs --app gpudrip-api
flyctl logs --app gpudrip

# Check status
flyctl status --app gpudrip-api
flyctl status --app gpudrip

# SSH into app
flyctl ssh console --app gpudrip-api
```

---

## Updating

```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
cd apps/api-server && flyctl deploy --remote-only
cd ../frontend && flyctl deploy --remote-only
```

---

## Troubleshooting

### Database connection issues
```bash
# Verify DATABASE_URL is set
flyctl secrets list --app gpudrip-api

# Test connection
flyctl ssh console --app gpudrip-api -C "psql \$DATABASE_URL -c 'SELECT 1;'"
```

### Workers not running
```bash
# Check logs for errors
flyctl logs --app gpudrip-api | grep -i error

# Restart app
flyctl apps restart gpudrip-api
```

### Frontend not connecting to API
```bash
# Verify API_SERVER_URL is correct
flyctl secrets list --app gpudrip
```

---

## Cost Estimate (Fly.io)

| Service | Spec | Monthly |
|---------|------|---------|
| Frontend | 512MB RAM, shared CPU | ~$2-5 |
| API | 512MB RAM, shared CPU (1 machine) | ~$2-5 |
| Postgres | 1GB RAM, 10GB disk | ~$15 |
| Redis | Free tier (Upstash) | ~$0 |
| **Total** | | **~$20-25/mo** |

---

## 90-Day Roadmap

| Month | Milestone |
|-------|-----------|
| **Month 1** | Launch with 22 GPUs, Best Buy integration, email alerts |
| **Month 2** | Add Amazon PA API, Newegg scraper, comparison pages |
| **Month 3** | Programmatic SEO, stock alerts, Micro Center |

**Key levers:**
- GPU model pages = Google-indexable with JSON-LD
- Price history charts = user engagement signal
- Stock alerts = retention mechanism
- Affiliate revenue scales with traffic
