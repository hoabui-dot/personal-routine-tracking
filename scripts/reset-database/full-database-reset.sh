#!/bin/bash

# Full Database Reset and Initialization Script
# This script drops and recreates the entire database with all migrations
# WARNING: This will DELETE ALL DATA in the database!

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

echo -e "${RED}========================================${NC}"
echo -e "${RED}FULL DATABASE RESET${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This will DELETE ALL DATA!${NC}"
echo -e "${RED}⚠️  This action CANNOT be undone!${NC}"
echo ""
echo -e "Database: ${YELLOW}$DB_NAME@$DB_HOST${NC}"
echo ""
read -p "Are you ABSOLUTELY SURE you want to reset the entire database? (type 'RESET' to confirm): " CONFIRM

if [ "$CONFIRM" != "RESET" ]; then
    echo -e "${YELLOW}Operation cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting full database reset...${NC}"
echo ""

# Function to run SQL file
run_sql_file() {
    local file=$1
    local description=$2
    
    echo -e "${BLUE}Running: $description${NC}"
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $description completed${NC}"
        return 0
    else
        echo -e "${RED}✗ $description failed${NC}"
        return 1
    fi
}

# Step 1: Drop all tables
echo -e "${YELLOW}Step 1: Dropping all existing tables...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS message_read_status CASCADE;
DROP TABLE IF EXISTS goal_sub_tasks CASCADE;
DROP TABLE IF EXISTS daily_sessions CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS sub_goals CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS cron_config CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_goal_sub_tasks_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop types
DROP TYPE IF EXISTS message_type CASCADE;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All tables dropped${NC}"
else
    echo -e "${RED}✗ Failed to drop tables${NC}"
    exit 1
fi

echo ""

# Step 2: Run all migrations in order
echo -e "${YELLOW}Step 2: Running all migrations...${NC}"
echo ""

# Array of migrations in order
declare -a migrations=(
    "api-service/sql/01_init.sql:Initial schema (goals, sub_goals, sessions)"
    "api-service/sql/02_update_subgoals.sql:Update sub-goals schema"
    "api-service/sql/03_fix_hours_spent.sql:Fix hours spent calculation"
    "api-service/sql/04_create_notes_table.sql:Create notes table"
    "api-service/sql/05_two_player_game.sql:Two-player game (users, user_goals, daily_sessions)"
    "api-service/sql/06_add_pause_support.sql:Add pause support (paused_at, total_paused_seconds)"
    "api-service/sql/07_add_authentication.sql:Add authentication (email, password)"
    "api-service/sql/08_add_avatar_url.sql:Add avatar URL"
    "api-service/sql/08_chat_messages.sql:Chat messages and read status"
    "api-service/sql/09_message_read_status.sql:Message read status"
    "api-service/sql/10_goal_sub_tasks.sql:Goal sub-tasks (goal_sub_tasks table, sub_task_id column)"
)

# Run each migration
for migration in "${migrations[@]}"; do
    IFS=':' read -r file description <<< "$migration"
    
    if [ -f "$file" ]; then
        run_sql_file "$file" "$description"
        if [ $? -ne 0 ]; then
            echo -e "${RED}Migration failed. Stopping.${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠ Skipping: $file (not found)${NC}"
    fi
    echo ""
done

# Step 3: Create cron_config table if not exists
echo -e "${YELLOW}Step 3: Creating cron_config table...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
CREATE TABLE IF NOT EXISTS cron_config (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL UNIQUE,
    schedule VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    description TEXT,
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default cron jobs
INSERT INTO cron_config (job_name, schedule, enabled, description) VALUES
    ('stop_paused_sessions', '0 0 * * *', true, 'Stop all paused sessions at midnight'),
    ('calculate_daily_reports', '1 0 * * *', true, 'Calculate daily reports after stopping sessions'),
    ('send_daily_reminders', '30 9 * * *', true, 'Send daily reminder emails at 9:30 AM')
ON CONFLICT (job_name) DO NOTHING;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Cron config table created${NC}"
else
    echo -e "${RED}✗ Failed to create cron config table${NC}"
fi

echo ""

# Step 4: Verify all tables exist
echo -e "${YELLOW}Step 4: Verifying database schema...${NC}"
echo ""

# Check all required tables
declare -a required_tables=(
    "goals"
    "sub_goals"
    "sessions"
    "notes"
    "users"
    "user_goals"
    "daily_sessions"
    "goal_sub_tasks"
    "chat_messages"
    "message_read_status"
    "cron_config"
)

ALL_TABLES_OK=true

for table in "${required_tables[@]}"; do
    TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$table');")
    
    if [ "$TABLE_EXISTS" = "t" ]; then
        echo -e "${GREEN}✓ Table '$table' exists${NC}"
    else
        echo -e "${RED}✗ Table '$table' NOT FOUND${NC}"
        ALL_TABLES_OK=false
    fi
done

echo ""

# Check critical columns
echo -e "${YELLOW}Checking critical columns...${NC}"
echo ""

# Check sub_task_id in daily_sessions
COLUMN_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_sessions' AND column_name = 'sub_task_id');")
if [ "$COLUMN_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ Column 'daily_sessions.sub_task_id' exists${NC}"
else
    echo -e "${RED}✗ Column 'daily_sessions.sub_task_id' NOT FOUND${NC}"
    ALL_TABLES_OK=false
fi

# Check paused_at in daily_sessions
COLUMN_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_sessions' AND column_name = 'paused_at');")
if [ "$COLUMN_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ Column 'daily_sessions.paused_at' exists${NC}"
else
    echo -e "${RED}✗ Column 'daily_sessions.paused_at' NOT FOUND${NC}"
    ALL_TABLES_OK=false
fi

# Check total_paused_seconds in daily_sessions
COLUMN_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_sessions' AND column_name = 'total_paused_seconds');")
if [ "$COLUMN_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ Column 'daily_sessions.total_paused_seconds' exists${NC}"
else
    echo -e "${RED}✗ Column 'daily_sessions.total_paused_seconds' NOT FOUND${NC}"
    ALL_TABLES_OK=false
fi

# Check email in users
COLUMN_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email');")
if [ "$COLUMN_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ Column 'users.email' exists${NC}"
else
    echo -e "${RED}✗ Column 'users.email' NOT FOUND${NC}"
    ALL_TABLES_OK=false
fi

# Check avatar_url in users
COLUMN_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url');")
if [ "$COLUMN_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ Column 'users.avatar_url' exists${NC}"
else
    echo -e "${RED}✗ Column 'users.avatar_url' NOT FOUND${NC}"
    ALL_TABLES_OK=false
fi

echo ""

# Step 5: Show database summary
echo -e "${YELLOW}Step 5: Database summary${NC}"
echo ""

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
"

echo ""

# Final result
if [ "$ALL_TABLES_OK" = true ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ DATABASE RESET SUCCESSFUL${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}All tables and columns are in place!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Restart backend: cd api-service && npm run dev"
    echo "2. Restart frontend: cd web-frontend && npm run dev"
    echo "3. Test the application"
    echo ""
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}✗ DATABASE RESET INCOMPLETE${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${RED}Some tables or columns are missing!${NC}"
    echo -e "${YELLOW}Please check the migration files and try again.${NC}"
    echo ""
    exit 1
fi
