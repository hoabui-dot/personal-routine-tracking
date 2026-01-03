#!/bin/bash

# Migration script for goal sub-tasks feature
# This script runs the 10_goal_sub_tasks.sql migration on the production database

set -e  # Exit on error

echo "========================================="
echo "Running Goal Sub-Tasks Migration"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load database credentials from api-service/.env
if [ -f "api-service/.env" ]; then
    export $(cat api-service/.env | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Loaded database credentials from api-service/.env${NC}"
else
    echo -e "${RED}✗ api-service/.env file not found${NC}"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ psql is not installed${NC}"
    echo "Install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt install postgresql-client"
    exit 1
fi

echo ""
echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Test connection
echo -e "${YELLOW}Testing database connection...${NC}"
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "Please check your database credentials in api-service/.env"
    exit 1
fi

echo ""
echo -e "${YELLOW}Checking if migration is needed...${NC}"

# Check if goal_sub_tasks table already exists
TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_sub_tasks');")

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${YELLOW}⚠ goal_sub_tasks table already exists${NC}"
    read -p "Do you want to re-run the migration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Migration cancelled"
        exit 0
    fi
fi

echo ""
echo -e "${YELLOW}Running migration: 10_goal_sub_tasks.sql${NC}"

# Run the migration
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f api-service/sql/10_goal_sub_tasks.sql; then
    echo ""
    echo -e "${GREEN}✓ Migration completed successfully${NC}"
else
    echo ""
    echo -e "${RED}✗ Migration failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Verifying migration...${NC}"

# Verify the table exists
TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_sub_tasks');")

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ goal_sub_tasks table exists${NC}"
else
    echo -e "${RED}✗ goal_sub_tasks table not found${NC}"
    exit 1
fi

# Verify the sub_task_id column exists in daily_sessions
COLUMN_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_sessions' AND column_name = 'sub_task_id');")

if [ "$COLUMN_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ sub_task_id column exists in daily_sessions${NC}"
else
    echo -e "${RED}✗ sub_task_id column not found in daily_sessions${NC}"
    exit 1
fi

# Show table structure
echo ""
echo -e "${YELLOW}Table structure:${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d goal_sub_tasks"

echo ""
echo "========================================="
echo -e "${GREEN}Migration Complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Rebuild backend: docker compose build backend"
echo "2. Rebuild frontend: docker compose build frontend"
echo "3. Restart services: docker compose up -d"
echo "4. Test the new settings page"
