#!/bin/bash

# Check if notes table exists in database

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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Checking Notes Table${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Database: ${GREEN}$DB_NAME@$DB_HOST${NC}"
echo ""

# Check if table exists
echo -e "${YELLOW}Checking if 'notes' table exists...${NC}"
TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes');")

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ Table 'notes' exists${NC}"
    echo ""
    
    # Show table structure
    echo -e "${YELLOW}Table structure:${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
    FROM information_schema.columns
    WHERE table_name = 'notes'
    ORDER BY ordinal_position;
    "
    
    echo ""
    
    # Show indexes
    echo -e "${YELLOW}Indexes:${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT 
        indexname,
        indexdef
    FROM pg_indexes
    WHERE tablename = 'notes';
    "
    
    echo ""
    
    # Count rows
    ROW_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM notes;")
    echo -e "${BLUE}Total notes: ${GREEN}$ROW_COUNT${NC}"
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Notes table is ready${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo -e "${RED}✗ Table 'notes' NOT FOUND${NC}"
    echo ""
    echo -e "${YELLOW}To create the table, run:${NC}"
    echo "./scripts/run-migration.sh api-service/migrations/001_create_notes_table.sql"
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}✗ Notes table missing${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
