# Mitr Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Environment Setup

### 1. Create Environment Files

**Frontend (.env in root directory):**
```bash
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Mitr
VITE_APP_VERSION=1.0.0
```

**Backend (.env in server directory):**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/mitr_db"
JWT_SECRET="mitr-super-secret-jwt-key-2024-production-ready"
PORT=3000
NODE_ENV=development
```

### 2. Database Setup

1. **Install PostgreSQL** (if not already installed)
2. **Create database:**
   ```bash
   createdb mitr_db
   ```

3. **Navigate to server directory:**
   ```bash
   cd server
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

6. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

7. **Push schema to database:**
   ```bash
   npx prisma db push
   ```

### 3. Frontend Setup

1. **Navigate to root directory:**
   ```bash
   cd ..
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Features Implemented

### ✅ Authentication System
- Login/Signup forms with validation
- JWT-based authentication
- Protected routes
- User session management
- Auth context and hooks

### ✅ API Integration
- Enhanced API client with error handling
- Token management
- Real-time data fetching
- Comprehensive error handling

### ✅ Dashboard
- Real-time statistics from database
- Conversation metrics
- Channel performance analytics
- Refresh functionality
- Loading states and error handling

### ✅ Conversations
- Real-time conversation list
- Message display and sending
- Conversation status tracking
- Platform indicators (WhatsApp, Instagram, Website)
- Loading states and error handling

### ✅ UI/UX
- Responsive design
- Loading indicators
- Error alerts
- Form validation
- Modern shadcn/ui components

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

### Conversations
- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations/:id/messages` - Send message

### Settings
- `GET /api/settings/me` - Get user settings
- `PUT /api/settings/settings` - Update settings

## Database Schema

The application uses PostgreSQL with Prisma ORM:

- **User** - User accounts and authentication
- **Conversation** - Customer conversations
- **Message** - Individual messages in conversations
- **Setting** - User preferences
- **Integration** - External platform connections
- **Subscription** - User subscription plans

## Next Steps

1. **Set up environment files** as described above
2. **Install and configure PostgreSQL**
3. **Run database migrations**
4. **Start both servers**
5. **Test the application**

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Ensure database exists

2. **Port conflicts:**
   - Frontend runs on port 8080
   - Backend runs on port 3000
   - Check if ports are available

3. **Authentication issues:**
   - Verify JWT_SECRET is set
   - Check token storage in localStorage

4. **API connection issues:**
   - Verify VITE_API_URL in frontend .env
   - Check CORS settings
   - Ensure backend is running

## Development Notes

- The application uses TypeScript throughout
- React Query for data fetching and caching
- Tailwind CSS for styling
- shadcn/ui for components
- Prisma for database operations
- JWT for authentication
