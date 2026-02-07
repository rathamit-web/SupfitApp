#!/bin/bash

# Coach Subscription Packages: Diagnostic & Fix Script
# This script helps diagnose and fix common issues with coach package persistence

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Coach Subscription Packages: Diagnostic Tool${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Install it first:${NC}"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in project root (no package.json found)${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking project setup...${NC}"

if [ -d "SupfitApp/supabase" ]; then
    echo -e "${GREEN}✓ Found SupfitApp/supabase directory${NC}"
    SUPABASE_DIR="SupfitApp/supabase"
elif [ -d "supabase" ]; then
    echo -e "${GREEN}✓ Found supabase directory${NC}"
    SUPABASE_DIR="supabase"
else
    echo -e "${RED}❌ Could not find supabase directory${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Available migration files:${NC}"
echo ""

# List migration files
if [ -d "$SUPABASE_DIR/migrations" ]; then
    echo "Migration files in $SUPABASE_DIR/migrations:"
    ls -la "$SUPABASE_DIR/migrations"/*.sql 2>/dev/null | tail -5 || echo "No migrations found"
else
    echo -e "${YELLOW}⚠ No migrations directory found${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Required migrations for Coach Packages:${NC}"
echo ""

REQUIRED_FILES=(
    "$SUPABASE_DIR/migrations/2026-02-01_add_professional_packages.sql"
    "$SUPABASE_DIR/migrations/20260201_sync_auth_to_public_users.sql"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file NOT FOUND${NC}"
    fi
done

echo ""
echo -e "${YELLOW}Step 4: Database status${NC}"
echo ""

# Try to connect to Supabase
if supabase projects list &> /dev/null; then
    echo -e "${GREEN}✓ Supabase CLI is authenticated${NC}"
    
    # Get linked project
    PROJECT=$(supabase projects list 2>/dev/null | head -2 | tail -1 | awk '{print $1}' || echo "")
    if [ -n "$PROJECT" ]; then
        echo -e "${GREEN}✓ Linked project: $PROJECT${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Supabase CLI not linked. Run: supabase link${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Recommendations:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "1. Verify migrations are applied:"
echo "   $ supabase db push"
echo ""
echo "2. Check database state:"
echo "   See COACH_PACKAGES_DEBUGGING_GUIDE.md for SQL queries"
echo ""
echo "3. Run app and watch console logs:"
echo "   $ npm run dev"
echo "   Look for logs starting with [CoachSubscription]"
echo ""
echo "4. For manual role updates, use Supabase Dashboard:"
echo "   Dashboard → SQL Editor → Copy from DEBUG_COACH_PACKAGES_SQL_UTILS.sql"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Diagnostic complete!${NC}"
