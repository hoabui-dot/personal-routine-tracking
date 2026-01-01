#!/bin/bash

# Script to reset/remove session data for a specific date
# Usage: ./reset-date.sh [YYYY-MM-DD]
# Example: ./reset-date.sh 2026-01-02

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
NC='\033[0m' # No Color

# Check if date parameter is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Date parameter is required${NC}"
    echo "Usage: $0 [YYYY-MM-DD]"
    echo "Example: $0 2026-01-02"
    exit 1
fi

DATE=$1

# Validate date format (basic check)
if ! [[ $DATE =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo -e "${RED}Error: Invalid date format${NC}"
    echo "Please use YYYY-MM-DD format (e.g., 2026-01-02)"
    exit 1
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Reset Date Data Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "Date to reset: ${GREEN}$DATE${NC}"
echo -e "Database: ${GREEN}$DB_NAME@$DB_HOST${NC}"
echo ""

# Show what will be deleted
echo -e "${YELLOW}Checking sessions for date $DATE...${NC}"
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
WHERE ds.date = '$DATE'
ORDER BY u.name;
"

# Count sessions
SESSION_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) FROM daily_sessions WHERE date = '$DATE';
" | xargs)

if [ "$SESSION_COUNT" -eq 0 ]; then
    echo -e "${GREEN}No sessions found for date $DATE${NC}"
    exit 0
fi

echo ""
echo -e "${RED}Found $SESSION_COUNT session(s) for date $DATE${NC}"
echo ""

# Confirm deletion
read -p "Do you want to DELETE these sessions? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Operation cancelled${NC}"
    exit 0
fi

# Delete sessions
echo ""
echo -e "${YELLOW}Deleting sessions for date $DATE...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
DELETE FROM daily_sessions WHERE date = '$DATE';
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully deleted $SESSION_COUNT session(s) for date $DATE${NC}"
    echo ""
    echo -e "${GREEN}Database has been reset for $DATE${NC}"
else
    echo -e "${RED}✗ Error deleting sessions${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}Reset completed successfully!${NC}"
echo -e "${YELLOW}========================================${NC}"
