#!/bin/bash

# Personal Tracker Development Startup Script
# This script starts the development environment without Docker

echo "🚀 Starting Personal Tracker Development Environment"
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm is available"

# Install dependencies if not already installed
print_info "Checking and installing dependencies..."

if [ ! -d "api-service/node_modules" ]; then
    print_info "Installing API service dependencies..."
    cd api-service && npm install && cd ..
    print_success "API service dependencies installed"
else
    print_success "API service dependencies already installed"
fi

if [ ! -d "web-frontend/node_modules" ]; then
    print_info "Installing frontend dependencies..."
    cd web-frontend && npm install && cd ..
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi

# Build projects
print_info "Building projects..."

print_info "Building API service..."
cd api-service && npm run build
if [ $? -eq 0 ]; then
    print_success "API service built successfully"
else
    print_error "API service build failed"
    exit 1
fi
cd ..

print_info "Building frontend..."
cd web-frontend && npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

echo ""
print_warning "⚠️  IMPORTANT: Database Setup Required"
echo "======================================"
echo ""
echo "Before starting the services, you need to set up PostgreSQL:"
echo ""
echo "1. Install PostgreSQL (if not already installed):"
echo "   - macOS: brew install postgresql"
echo "   - Ubuntu: sudo apt-get install postgresql"
echo "   - Windows: Download from https://www.postgresql.org/"
echo ""
echo "2. Start PostgreSQL service"
echo ""
echo "3. Create database and user:"
echo "   psql -U postgres"
echo "   CREATE DATABASE personal_tracker;"
echo "   CREATE USER tracker_user WITH PASSWORD 'tracker_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE personal_tracker TO tracker_user;"
echo "   \\q"
echo ""
echo "4. Run the database schema:"
echo "   psql -U tracker_user -d personal_tracker -f api-service/sql/01_init.sql"
echo ""
print_warning "After setting up the database, you can start the services:"
echo ""
echo "🖥️  Start API Service (Terminal 1):"
echo "   cd api-service && npm run dev"
echo ""
echo "🌐 Start Frontend (Terminal 2):"
echo "   cd web-frontend && npm run dev"
echo ""
echo "🧪 Test the system (Terminal 3):"
echo "   ./test-system.sh"
echo ""
echo "📱 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   API: http://localhost:4000"
echo "   API Health: http://localhost:4000/health"
echo ""
print_success "Setup complete! Follow the database setup instructions above."
