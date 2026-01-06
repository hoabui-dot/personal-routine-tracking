#!/bin/bash

# Run Database Migration Script
# This script runs a specific migration file

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

# Check if migration file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No migration file specified${NC}"
    echo ""
    echo "Usage: $0 <migration-file>"
    echo ""
    echo "Example: $0 api-service/migrations/001_create_notes_table.sql"
    echo ""
    exit 1
fi

MIGRATION_FILE=$1

# Check if file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Running Database Migration${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Database: ${GREEN}$DB_NAME@$DB_HOST${NC}"
echo -e "Migration: ${GREEN}$MIGRATION_FILE${NC}"
echo ""

# Run the migration
echo -e "${YELLOW}Executing migration...${NC}"
echo ""

if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_FILE"; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Migration completed successfully${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}✗ Migration failed${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
