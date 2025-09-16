# Personal Routine Tracker

A full-stack personal routine tracker application built with microservice architecture.

## Features

- **Goals Management**: Create, read, update, and delete personal goals
- **Year-based Goal Tracking**: Organize goals by target year
- **Responsive UI**: Modern, mobile-friendly interface
- **Real-time Updates**: Instant feedback on all operations
- **Microservice Architecture**: Separate frontend and backend services

## Tech Stack

### Backend (API Service)
- **Node.js** with **TypeScript**
- **Express.js** web framework
- **PostgreSQL** database with direct SQL queries
- **Docker** containerization

### Frontend (Web Frontend)
- **Next.js** with **TypeScript**
- **React** components
- **Axios** for API communication
- **CSS** for styling

## Project Structure

```
personal_tracking/
├── api-service/           # Backend API service
│   ├── src/
│   │   ├── app.ts        # Main application entry point
│   │   ├── db.ts         # Database connection and utilities
│   │   ├── routes/       # API route handlers
│   │   └── types/        # TypeScript type definitions
│   ├── sql/              # Database schema and migrations
│   ├── Dockerfile        # Backend container configuration
│   └── package.json      # Backend dependencies
├── web-frontend/         # Frontend Next.js application
│   ├── pages/            # Next.js pages
│   ├── components/       # React components
│   ├── lib/              # Utility libraries (API client)
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # CSS styles
│   ├── Dockerfile        # Frontend container configuration
│   └── package.json      # Frontend dependencies
├── docker-compose.yml    # Multi-container orchestration
└── README.md            # This file
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **PostgreSQL** (if running without Docker)

### Option 1: Using Docker Compose (Recommended)

1. **Clone and navigate to the project:**
   ```bash
   cd personal_tracking
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Database: localhost:5432

### Option 2: Manual Setup

1. **Setup Database:**
   ```bash
   # Install and start PostgreSQL
   # Create database: personal_tracker
   # Run SQL scripts from api-service/sql/
   ```

2. **Start Backend:**
   ```bash
   cd api-service
   npm install
   npm run build
   npm start
   # Backend runs on http://localhost:4000
   ```

3. **Start Frontend:**
   ```bash
   cd web-frontend
   npm install
   npm run build
   npm start
   # Frontend runs on http://localhost:3000
   ```

## API Endpoints

### Goals Management

- `GET /goals` - Get all goals (optional: ?year=2024)
- `GET /goals/:id` - Get a specific goal
- `POST /goals` - Create a new goal
- `PUT /goals/:id` - Update a goal
- `DELETE /goals/:id` - Delete a goal

### Health Check

- `GET /health` - API health status

## Database Schema

### Goals Table
```sql
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Development

### Backend Development
```bash
cd api-service
npm run dev  # Start with hot reload
npm run lint # Run ESLint
npm run format # Format with Prettier
```

### Frontend Development
```bash
cd web-frontend
npm run dev  # Start with hot reload
npm run lint # Run ESLint
npm run format # Format with Prettier
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=tracker_user
DB_PASSWORD=tracker_password
DB_NAME=personal_tracker
PORT=4000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Features Implemented

✅ **Goals Management**
- Create new goals with title and target year
- View all goals in a responsive grid layout
- Edit existing goals with inline modal
- Delete goals with confirmation
- Real-time error handling and success messages

✅ **Technical Features**
- TypeScript for type safety
- ESLint and Prettier for code quality
- Docker containerization
- PostgreSQL with proper schema
- Responsive CSS design
- API error handling
- Form validation

## Next Steps (Future Enhancements)

- Sub-goals management
- Session tracking (start/stop timers)
- Progress reports and analytics
- Calendar view for goal scheduling
- Notification system
- User authentication
- Data export/import

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details
