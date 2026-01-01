#!/bin/bash

echo "🦫 Installing Real-time Chat Feature for Capybara Tracker"
echo "=========================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd api-service
npm install socket.io@^4.7.2
npm install --save-dev @types/socket.io@^3.0.2

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Backend dependencies installation had issues${NC}"
fi

cd ..

# Install frontend dependencies
echo ""
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd web-frontend
npm install socket.io-client@^4.7.2

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend dependencies installation had issues${NC}"
fi

cd ..

# Database migration instructions
echo ""
echo -e "${YELLOW}📊 Database Migration Required${NC}"
echo "Please run the following SQL migration:"
echo ""
echo "  psql -U your_username -d personal_tracker -f api-service/sql/08_chat_messages.sql"
echo ""
echo "Or execute the SQL file manually in your database client."
echo ""

# Final instructions
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run the database migration (see above)"
echo "2. Restart your backend: cd api-service && npm run dev"
echo "3. Restart your frontend: cd web-frontend && npm run dev"
echo "4. Navigate to /calendar page to see the chat"
echo ""
echo "📖 See CHAT_SETUP.md for detailed documentation"
echo ""
echo "🦫 Happy chatting!"
