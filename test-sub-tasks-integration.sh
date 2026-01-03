#!/bin/bash

# Integration test script for sub-tasks feature
# Tests the complete flow from database to frontend

set -e

echo "========================================="
echo "Sub-Tasks Feature Integration Test"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test function
test_api() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing: $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "=== Backend API Tests ==="
echo ""

# Test 1: Get all sub-tasks (should work even if empty)
test_api "GET /goal-sub-tasks" "GET" "http://localhost:4000/goal-sub-tasks" "" "200"

# Test 2: Get user goals (needed for creating sub-tasks)
test_api "GET /user-goals" "GET" "http://localhost:4000/user-goals" "" "200"

echo ""
echo "=== Frontend Proxy Tests ==="
echo ""

# Test 3: Frontend proxy for sub-tasks
test_api "GET /api/goal-sub-tasks" "GET" "http://localhost:3000/api/goal-sub-tasks" "" "200"

# Test 4: Frontend proxy for user goals
test_api "GET /api/game/user-goals" "GET" "http://localhost:3000/api/game/user-goals" "" "200"

echo ""
echo "=== Database Schema Tests ==="
echo ""

# Load database credentials
if [ -f "api-service/.env" ]; then
    export $(cat api-service/.env | grep -v '^#' | xargs)
fi

# Check if psql is available
if command -v psql &> /dev/null; then
    echo -n "Checking goal_sub_tasks table... "
    TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_sub_tasks');" 2>/dev/null || echo "f")
    
    if [ "$TABLE_EXISTS" = "t" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Table not found)"
        FAILED=$((FAILED + 1))
    fi
    
    echo -n "Checking sub_task_id column... "
    COLUMN_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_sessions' AND column_name = 'sub_task_id');" 2>/dev/null || echo "f")
    
    if [ "$COLUMN_EXISTS" = "t" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Column not found)"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC} (psql not installed)"
fi

echo ""
echo "=== File Structure Tests ==="
echo ""

# Check backend files
echo -n "Checking backend route handler... "
if [ -f "api-service/src/routes/goalSubTasks.ts" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

# Check frontend files
echo -n "Checking frontend API proxy... "
if [ -f "web-frontend/pages/api/goal-sub-tasks.ts" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

echo -n "Checking frontend settings page... "
if [ -f "web-frontend/pages/settings.tsx" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

# Check migration file
echo -n "Checking migration file... "
if [ -f "api-service/sql/10_goal_sub_tasks.sql" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "The sub-tasks feature is properly integrated."
    echo "You can now use the settings page to manage sub-tasks."
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    echo ""
    echo "Please check the following:"
    echo "1. Run database migration: ./run-migration.sh"
    echo "2. Rebuild backend: docker compose build backend"
    echo "3. Rebuild frontend: docker compose build frontend"
    echo "4. Restart services: docker compose up -d"
    exit 1
fi
