#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
FAILED=0
PASSED=0

echo "=========================================="
echo "Testing All Frontend API Endpoints"
echo "=========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    local description=$5
    
    echo -n "Testing: $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
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

echo "=== Game API Endpoints ==="
echo ""

# Users
test_endpoint "GET" "/api/game/users" "200" "" "GET /api/game/users"

# User Goals
test_endpoint "GET" "/api/game/user-goals" "200" "" "GET /api/game/user-goals"

# Daily Sessions - Summary
test_endpoint "GET" "/api/game/daily-sessions/summary" "200" "" "GET /api/game/daily-sessions/summary"

# Daily Sessions - Get all
test_endpoint "GET" "/api/game/daily-sessions" "200" "" "GET /api/game/daily-sessions"

# Daily Sessions - Get with date filter
TODAY=$(date +%Y-%m-%d)
test_endpoint "GET" "/api/game/daily-sessions?date=$TODAY" "200" "" "GET /api/game/daily-sessions?date=$TODAY"

# Daily Sessions - Check and cleanup
test_endpoint "POST" "/api/game/daily-sessions/check-and-cleanup" "200" "{}" "POST /api/game/daily-sessions/check-and-cleanup"

echo ""
echo "=== Notes API Endpoints ==="
echo ""

# Notes - Get all
test_endpoint "GET" "/api/notes" "200" "" "GET /api/notes"

# Notes - Get with date filter
test_endpoint "GET" "/api/notes?date=$TODAY" "200" "" "GET /api/notes?date=$TODAY"

echo ""
echo "=== Auth API Endpoints (without token) ==="
echo ""

# Auth endpoints will fail without proper credentials, but should return proper error codes
test_endpoint "POST" "/api/auth/refresh" "401" "{}" "POST /api/auth/refresh (should fail without token)"

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
