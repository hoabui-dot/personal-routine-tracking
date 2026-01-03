#!/bin/bash

# Script to reset/remove session data for a specific date and set up fresh data
# Usage: ./reset-date.sh [YYYY-MM-DD]
# Example: ./reset-date.sh 2026-01-04

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

# Check if date parameter is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Date parameter is required${NC}"
    echo "Usage: $0 [YYYY-MM-DD]"
    echo "Example: $0 2026-01-04"
    exit 1
fi

DATE=$1

# Validate date format (basic check)
if ! [[ $DATE =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo -e "${RED}Error: Invalid date format${NC}"
    echo "Please use YYYY-MM-DD format (e.g., 2026-01-04)"
    exit 1
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Reset Date Data Script (Updated)${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "Date to reset: ${GREEN}$DATE${NC}"
echo -e "Database: ${GREEN}$DB_NAME@$DB_HOST${NC}"
echo ""

# Show current database structure
echo -e "${BLUE}Current database structure:${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    'Users' as table_name,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Goals' as table_name,
    COUNT(*) as count
FROM goals
UNION ALL
SELECT 
    'User Goals' as table_name,
    COUNT(*) as count
FROM user_goals
UNION ALL
SELECT 
    'Goal Sub-Tasks' as table_name,
    COUNT(*) as count
FROM goal_sub_tasks
UNION ALL
SELECT 
    'Daily Sessions' as table_name,
    COUNT(*) as count
FROM daily_sessions;
"

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
    ds.duration_completed_minutes,
    CASE 
        WHEN ds.sub_task_id IS NOT NULL THEN gst.title 
        ELSE 'Main Goal' 
    END as sub_task
FROM daily_sessions ds
JOIN users u ON ds.user_id = u.id
JOIN goals g ON ds.goal_id = g.id
LEFT JOIN goal_sub_tasks gst ON ds.sub_task_id = gst.id
WHERE ds.date = '$DATE'
ORDER BY u.name;
"

# Count sessions
SESSION_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) FROM daily_sessions WHERE date = '$DATE';
" | xargs)

if [ "$SESSION_COUNT" -gt 0 ]; then
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
    else
        echo -e "${RED}✗ Error deleting sessions${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}No existing sessions found for date $DATE${NC}"
fi

echo ""
echo -e "${BLUE}Setting up fresh data for $DATE...${NC}"

# Show available users and goals
echo -e "${YELLOW}Available users and their goals:${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email,
    g.id as goal_id,
    g.title as goal_title,
    ug.daily_duration_minutes,
    ROUND(ug.daily_duration_minutes / 60.0, 1) as daily_duration_hours
FROM users u
JOIN user_goals ug ON u.id = ug.user_id
JOIN goals g ON ug.goal_id = g.id
ORDER BY u.id, g.id;
"

echo ""
echo -e "${YELLOW}Available sub-tasks:${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    gst.id,
    u.name as user_name,
    g.title as goal_title,
    gst.title as sub_task_title,
    gst.duration_minutes,
    gst.display_order
FROM goal_sub_tasks gst
JOIN user_goals ug ON gst.user_goal_id = ug.id
JOIN users u ON ug.user_id = u.id
JOIN goals g ON ug.goal_id = g.id
ORDER BY u.name, g.title, gst.display_order;
"

echo ""
echo -e "${GREEN}Database has been reset for $DATE${NC}"
echo ""
echo -e "${BLUE}You can now:${NC}"
echo -e "1. Navigate to the calendar page"
echo -e "2. Select the goal from the dropdown"
echo -e "3. Start sessions for users"
echo -e "4. Test sub-task functionality"
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}Reset completed successfully!${NC}"
echo -e "${YELLOW}========================================${NC}"
