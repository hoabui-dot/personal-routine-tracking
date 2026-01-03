#!/bin/bash

echo "=== Testing Goals CRUD Operations ==="
echo ""

# Test 1: GET all goals
echo "1. GET /api/goals"
curl -s http://localhost:3000/api/goals | jq '.'
echo ""

# Test 2: CREATE a new goal
echo "2. POST /api/goals (Create)"
NEW_GOAL=$(curl -s -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -d '{"title":"Test CRUD Goal","year":2026}')
echo "$NEW_GOAL" | jq '.'
GOAL_ID=$(echo "$NEW_GOAL" | jq -r '.data.id')
echo "Created goal ID: $GOAL_ID"
echo ""

# Test 3: GET specific goal
echo "3. GET /api/goals/$GOAL_ID"
curl -s "http://localhost:3000/api/goals/$GOAL_ID" | jq '.'
echo ""

# Test 4: UPDATE goal
echo "4. PUT /api/goals/$GOAL_ID (Update)"
curl -s -X PUT "http://localhost:3000/api/goals/$GOAL_ID" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated CRUD Goal","year":2027}' | jq '.'
echo ""

# Test 5: GET updated goal
echo "5. GET /api/goals/$GOAL_ID (Verify update)"
curl -s "http://localhost:3000/api/goals/$GOAL_ID" | jq '.'
echo ""

# Test 6: DELETE goal
echo "6. DELETE /api/goals/$GOAL_ID"
curl -s -X DELETE "http://localhost:3000/api/goals/$GOAL_ID" | jq '.'
echo ""

# Test 7: Verify deletion
echo "7. GET /api/goals/$GOAL_ID (Should be 404)"
curl -s "http://localhost:3000/api/goals/$GOAL_ID" | jq '.'
echo ""

echo "=== CRUD Tests Complete ==="
