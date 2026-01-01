#!/bin/bash

echo "🔍 Checking Chat Database Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get database credentials from .env
if [ -f "api-service/.env" ]; then
    export $(cat api-service/.env | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-personal_tracker}
DB_USER=${DB_USER:-postgres}

echo -e "${BLUE}Database Connection Info:${NC}"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Check if chat_messages table exists
echo -e "${BLUE}Checking if chat_messages table exists...${NC}"
TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages');")

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✅ chat_messages table exists${NC}"
    echo ""
    
    # Show table structure
    echo -e "${BLUE}Table Structure:${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d chat_messages"
    echo ""
    
    # Count messages
    MESSAGE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM chat_messages;")
    echo -e "${BLUE}Total messages in database: ${GREEN}$MESSAGE_COUNT${NC}"
    echo ""
    
    # Show recent messages
    if [ "$MESSAGE_COUNT" -gt 0 ]; then
        echo -e "${BLUE}Recent messages (last 5):${NC}"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
            SELECT 
                cm.id,
                u.name as user_name,
                LEFT(cm.message, 50) as message,
                cm.created_at
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.is_deleted = FALSE
            ORDER BY cm.created_at DESC
            LIMIT 5;
        "
    else
        echo -e "${YELLOW}No messages in database yet${NC}"
    fi
    echo ""
    
    # Check indexes
    echo -e "${BLUE}Indexes:${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'chat_messages';
    "
    
else
    echo -e "${RED}❌ chat_messages table does NOT exist${NC}"
    echo ""
    echo -e "${YELLOW}Please run the migration:${NC}"
    echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f api-service/sql/08_chat_messages.sql"
    echo ""
    echo "Or run it manually:"
    echo "  PGPASSWORD=\$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f api-service/sql/08_chat_messages.sql"
fi

echo ""
echo -e "${GREEN}Check complete!${NC}"
