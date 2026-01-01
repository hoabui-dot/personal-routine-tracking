#!/bin/bash

# Script to reset/remove session data for a date range
# Usage: ./reset-date-range.sh [START_DATE] [END_DATE]
# Example: ./reset-date-range.sh 2026-01-01 2026-01-05

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

# Check if date parameters are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Error: Start date and end date parameters are required${NC}"
    echo "Usage: $0 [START_DATE] [END_DATE]"
    echo "Example: $0 2026-01-01 2026-01-05"
    exit 1
fi

START_DATE=$1
END_DATE=$2

# Validate date format (basic check)
if ! [[ $START_DATE =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo -e "${RED}Error: Invalid start date format${NC}"
    echo "Please use YYYY-MM-DD format (e.g., 2026-01-01)"
    exit 1
fi

if ! [[ $END_DATE =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo -e "${RED}Error: Invalid end date format${NC}"
    echo "Please use YYYY-MM-DD format (e.g., 2026-01-05)"
    exit 1
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Reset Date Range Data Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "Date range: ${GREEN}$START_DATE${NC} to ${GREEN}$END_DATE${NC}"
echo -e "Database: ${GREEN}$DB_NAME@$DB_HOST${NC}"
echo ""

# Show what will be deleted
echo -e "${YELLOW}Checking sessions for date range $START_DATE to $END_DATE...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    ds.date::text,
    u.name as user_name,
    g.title as goal_title,
    ds.status,
    ds.started_at,
    ds.duration_completed_minutes
FROM daily_sessions ds
JOIN users u ON ds.user_id = u.id
JOIN goals g ON ds.goal_id = g.id
WHERE ds.date >= '$START_DATE' AND ds.date <= '$END_DATE'
ORDER BY ds.date, u.name;
"

# Count sessions
SESSION_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) FROM daily_sessions WHERE date >= '$START_DATE' AND date <= '$END_DATE';
" | xargs)

if [ "$SESSION_COUNT" -eq 0 ]; then
    echo -e "${GREEN}No sessions found for date range $START_DATE to $END_DATE${NC}"
    exit 0
fi

echo ""
echo -e "${RED}Found $SESSION_COUNT session(s) in date range $START_DATE to $END_DATE${NC}"
echo ""

# Confirm deletion
read -p "Do you want to DELETE these sessions? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Operation cancelled${NC}"
    exit 0
fi

# Delete sessions
echo ""
echo -e "${YELLOW}Deleting sessions for date range $START_DATE to $END_DATE...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
DELETE FROM daily_sessions WHERE date >= '$START_DATE' AND date <= '$END_DATE';
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully deleted $SESSION_COUNT session(s) for date range $START_DATE to $END_DATE${NC}"
    echo ""
    echo -e "${GREEN}Database has been reset for the specified date range${NC}"
else
    echo -e "${RED}✗ Error deleting sessions${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}Reset completed successfully!${NC}"
echo -e "${YELLOW}========================================${NC}"
