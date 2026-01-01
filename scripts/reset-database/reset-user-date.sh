#!/bin/bash

# Script to reset/remove session data for a specific user and date
# Usage: ./reset-user-date.sh [USER_ID] [YYYY-MM-DD]
# Example: ./reset-user-date.sh 1 2026-01-02

# Database connection details
DB_HOST="13.210.111.152"
DB_PORT="5432"
DB_USER="superuser"
DB_PASSWORD="superuser"
DB_NAME="personal_tracker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if parameters are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Error: User ID and date parameters are required${NC}"
    echo "Usage: $0 [USER_ID] [YYYY-MM-DD]"
    echo "Example: $0 1 2026-01-02"
    echo ""
    echo -e "${BLUE}Available users:${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT id, name, email FROM users ORDER BY id;
    "
    exit 1
fi

USER_ID=$1
DATE=$2

# Validate date format (basic check)
if ! [[ $DATE =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo -e "${RED}Error: Invalid date format${NC}"
    echo "Please use YYYY-MM-DD format (e.g., 2026-01-02)"
    exit 1
fi

# Validate user ID is a number
if ! [[ $USER_ID =~ ^[0-9]+$ ]]; then
    echo -e "${RED}Error: User ID must be a number${NC}"
    exit 1
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Reset User Date Data Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Get user name
USER_NAME=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT name FROM users WHERE id = $USER_ID;
" | xargs)

if [ -z "$USER_NAME" ]; then
    echo -e "${RED}Error: User ID $USER_ID not found${NC}"
    echo ""
    echo -e "${BLUE}Available users:${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT id, name, email FROM users ORDER BY id;
    "
    exit 1
fi

echo -e "User: ${GREEN}$USER_NAME${NC} (ID: $USER_ID)"
echo -e "Date: ${GREEN}$DATE${NC}"
echo -e "Database: ${GREEN}$DB_NAME@$DB_HOST${NC}"
echo ""

# Show what will be deleted
echo -e "${YELLOW}Checking sessions for user $USER_NAME on date $DATE...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    ds.id,
    u.name as user_name,
    g.title as goal_title,
    ds.status,
    ds.started_at,
    ds.finished_at,
    ds.duration_completed_minutes
FROM daily_sessions ds
JOIN users u ON ds.user_id = u.id
JOIN goals g ON ds.goal_id = g.id
WHERE ds.user_id = $USER_ID AND ds.date = '$DATE'
ORDER BY ds.id;
"

# Count sessions
SESSION_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) FROM daily_sessions WHERE user_id = $USER_ID AND date = '$DATE';
" | xargs)

if [ "$SESSION_COUNT" -eq 0 ]; then
    echo -e "${GREEN}No sessions found for user $USER_NAME on date $DATE${NC}"
    exit 0
fi

echo ""
echo -e "${RED}Found $SESSION_COUNT session(s) for user $USER_NAME on date $DATE${NC}"
echo ""

# Confirm deletion
read -p "Do you want to DELETE these sessions? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Operation cancelled${NC}"
    exit 0
fi

# Delete sessions
echo ""
echo -e "${YELLOW}Deleting sessions for user $USER_NAME on date $DATE...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
DELETE FROM daily_sessions WHERE user_id = $USER_ID AND date = '$DATE';
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully deleted $SESSION_COUNT session(s) for user $USER_NAME on date $DATE${NC}"
    echo ""
    echo -e "${GREEN}Database has been reset for user $USER_NAME on $DATE${NC}"
else
    echo -e "${RED}✗ Error deleting sessions${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}Reset completed successfully!${NC}"
echo -e "${YELLOW}========================================${NC}"
