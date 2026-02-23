#!/bin/bash
set -e

echo "🚀 GPUWatch Deployment Script"
echo "==============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
command -v flyctl >/dev/null 2>&1 || { echo -e "${RED}Error: flyctl is required but not installed.${NC}"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo -e "${RED}Error: pnpm is required but not installed.${NC}"; exit 1; }

echo ""
echo -e "${YELLOW}Step 1: Create Fly.io apps${NC}"
echo "---------------------------"

# Create apps if they don't exist
flyctl apps create gpudrip-api --org personal 2>/dev/null || echo "gpudrip-api already exists"
flyctl apps create gpudrip --org personal 2>/dev/null || echo "gpudrip already exists"

echo ""
echo -e "${YELLOW}Step 2: Create Postgres Database${NC}"
echo "--------------------------------"
echo "Creating Postgres cluster (this may take a few minutes)..."
flyctl postgres create --name gpudrip-db --region iad --vm-size shared-cpu-1x --volume-size 10 --org personal 2>/dev/null || echo "gpudrip-db already exists"

echo ""
echo -e "${YELLOW}Step 3: Attach Database to API${NC}"
echo "-------------------------------"
flyctl postgres attach gpudrip-db --app gpudrip-api 2>/dev/null || echo "Database already attached"

echo ""
echo -e "${YELLOW}Step 4: Create Redis${NC}"
echo "-------------------"
flyctl redis create --name gpudrip-redis --region iad --eviction --org personal 2>/dev/null || echo "gpudrip-redis already exists"

echo ""
echo -e "${YELLOW}Step 5: Attach Redis to API${NC}"
echo "--------------------------"
flyctl redis attach gpudrip-redis --app gpudrip-api 2>/dev/null || echo "Redis already attached"

echo ""
echo -e "${YELLOW}Step 6: Set Secrets${NC}"
echo "------------------"
echo "Please provide the following secrets:"

read -p "Best Buy API Key: " BESTBUY_API_KEY
read -p "Resend API Key: " RESEND_API_KEY
read -p "Resend From Email: " RESEND_FROM
read -p "Admin Key (for /admin access): " ADMIN_KEY

echo "Setting secrets for gpudrip-api..."
flyctl secrets set --app gpudrip-api \
    BESTBUY_API_KEY="$BESTBUY_API_KEY" \
    RESEND_API_KEY="$RESEND_API_KEY" \
    RESEND_FROM="$RESEND_FROM" \
    ADMIN_KEY="$ADMIN_KEY" \
    NEXT_PUBLIC_APP_URL="https://gpudrip.com" \
    API_SERVER_URL="https://gpudrip-api.fly.dev"

echo "Setting secrets for gpudrip frontend..."
flyctl secrets set --app gpudrip \
    NEXT_PUBLIC_APP_URL="https://gpudrip.com" \
    API_SERVER_URL="https://gpudrip-api.fly.dev"

echo ""
echo -e "${YELLOW}Step 7: Deploy API Server${NC}"
echo "------------------------"
cd apps/api-server
flyctl deploy --remote-only
cd ../..

echo ""
echo -e "${YELLOW}Step 8: Deploy Frontend${NC}"
echo "----------------------"
cd apps/frontend
flyctl deploy --remote-only
cd ../..

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run database migrations: flyctl ssh console --app gpudrip-api -C 'pnpm db:migrate'"
echo "2. Seed GPU data: flyctl ssh console --app gpudrip-api -C 'pnpm db:seed'"
echo "3. Configure DNS: Point gpudrip.com to $(flyctl status --app gpudrip --json | grep -o '"hostname": "[^"]*' | cut -d'"' -f4)"
echo ""
echo "Your apps:"
echo "  Frontend: https://gpudrip.com"
echo "  API:      https://gpudrip-api.fly.dev"
