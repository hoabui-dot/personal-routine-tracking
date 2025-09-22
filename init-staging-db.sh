#!/bin/bash

# Initialize database for staging deployment
# This script should be run after the first deployment to set up database tables

set -e

echo "🗄️  Initializing staging database..."

# Check if database container is running
if ! docker ps | grep -q "service-database"; then
    echo "❌ Database container is not running. Please start the services first:"
    echo "   docker compose -f docker-compose.staging.yml up -d"
    exit 1
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
counter=0
while ! docker exec service-database pg_isready -U superuser -d personal_tracker > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ Database failed to become ready within $timeout seconds"
        exit 1
    fi
    echo "   Waiting... ($counter/$timeout)"
    sleep 1
    counter=$((counter + 1))
done

echo "✅ Database is ready!"

# Run database initialization
echo "🔧 Running database initialization scripts..."

# Check if init script exists
if [ ! -f "api-service/sql/01_init.sql" ]; then
    echo "❌ Database initialization script not found: api-service/sql/01_init.sql"
    exit 1
fi

# Execute the initialization script
echo "📝 Executing 01_init.sql..."
docker exec -i service-database psql -U superuser -d personal_tracker < api-service/sql/01_init.sql

# Check if additional scripts exist and run them
if [ -f "api-service/sql/02_update_subgoals.sql" ]; then
    echo "📝 Executing 02_update_subgoals.sql..."
    docker exec -i service-database psql -U superuser -d personal_tracker < api-service/sql/02_update_subgoals.sql
fi

if [ -f "api-service/sql/03_fix_hours_spent.sql" ]; then
    echo "📝 Executing 03_fix_hours_spent.sql..."
    docker exec -i service-database psql -U superuser -d personal_tracker < api-service/sql/03_fix_hours_spent.sql
fi

# Verify database setup
echo "🔍 Verifying database setup..."
TABLES=$(docker exec service-database psql -U superuser -d personal_tracker -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
TABLES=$(echo $TABLES | tr -d ' ')

if [ "$TABLES" -ge "3" ]; then
    echo "✅ Database initialization completed successfully!"
    echo "   Created $TABLES tables in the database"
    
    # Show table list
    echo ""
    echo "📋 Database tables:"
    docker exec service-database psql -U superuser -d personal_tracker -c "\dt"
    
    echo ""
    echo "🎉 Your staging environment is ready!"
    echo "   Frontend: http://your-server-ip:3000"
    echo "   Backend API: http://your-server-ip:4000"
    echo "   Logs viewer: http://your-server-ip:5555"
else
    echo "❌ Database initialization may have failed. Expected at least 3 tables, found $TABLES"
    exit 1
fi
