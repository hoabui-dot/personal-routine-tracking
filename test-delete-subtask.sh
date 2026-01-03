#!/bin/bash

# Test script for deleting sub-tasks
# This helps debug the 500 error when deleting sub-tasks

echo "🧪 Testing Sub-Task Deletion"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: List all sub-tasks
echo -e "${YELLOW}Step 1: Listing all sub-tasks...${NC}"
SUBTASKS=$(curl -s http://localhost:4000/api/goal-sub-tasks)
echo "$SUBTASKS" | jq '.'
echo ""

# Get first sub-task ID
SUBTASK_ID=$(echo "$SUBTASKS" | jq -r '.data[0].id')

if [ "$SUBTASK_ID" == "null" ] || [ -z "$SUBTASK_ID" ]; then
  echo -e "${RED}No sub-tasks found. Please create one first.${NC}"
  exit 1
fi

echo -e "${GREEN}Found sub-task ID: $SUBTASK_ID${NC}"
echo ""

# Step 2: Check if any sessions use this sub-task
echo -e "${YELLOW}Step 2: Checking sessions using this sub-task...${NC}"
SESSIONS=$(curl -s "http://localhost:4000/api/daily-sessions")
SESSIONS_WITH_SUBTASK=$(echo "$SESSIONS" | jq ".data[] | select(.sub_task_id == $SUBTASK_ID)")

if [ -z "$SESSIONS_WITH_SUBTASK" ]; then
  echo -e "${GREEN}No sessions using this sub-task${NC}"
else
  echo -e "${YELLOW}Found sessions using this sub-task:${NC}"
  echo "$SESSIONS_WITH_SUBTASK" | jq '.'
fi
echo ""

# Step 3: Try to delete the sub-task
echo -e "${YELLOW}Step 3: Attempting to delete sub-task $SUBTASK_ID...${NC}"
DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "http://localhost:4000/api/goal-sub-tasks/$SUBTASK_ID")

# Split response and status code
HTTP_BODY=$(echo "$DELETE_RESPONSE" | head -n -1)
HTTP_STATUS=$(echo "$DELETE_RESPONSE" | tail -n 1)

echo "HTTP Status: $HTTP_STATUS"
echo "Response:"
echo "$HTTP_BODY" | jq '.'
echo ""

if [ "$HTTP_STATUS" == "200" ]; then
  echo -e "${GREEN}✓ Sub-task deleted successfully!${NC}"
elif [ "$HTTP_STATUS" == "500" ]; then
  echo -e "${RED}✗ 500 Internal Server Error${NC}"
  echo ""
  echo -e "${YELLOW}Check the backend logs for more details:${NC}"
  echo "  cd api-service"
  echo "  npm run dev"
  echo ""
  echo -e "${YELLOW}The error details should be logged with [DELETE] prefix${NC}"
else
  echo -e "${RED}✗ Unexpected status code: $HTTP_STATUS${NC}"
fi

echo ""
echo "================================"
echo "Test complete"
echo "================================"
