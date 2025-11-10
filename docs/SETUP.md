# 🚀 Schat Setup Guide

Complete installation and setup instructions for the Schat application.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git (optional)

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env.local` file with:
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/schat

# AI Services
OPENAI_API_KEY=your_openai_key
REPLICATE_API_TOKEN=your_replicate_token
TOGETHER_API_KEY=your_together_key

# Session
SESSION_SECRET=your_secret_key

# Firebase (optional)
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### 3. Database Setup
```bash
# Run main migrations
npm run db:push

# Setup Super AI
npm run migrate:super-ai

# Setup Admin Panel
npm run migrate:admin
```

Or run all at once:
```bash
npm run admin:setup
```

### 4. Create Admin Account
```bash
npm run create-admin
```

### 5. Start Development Server
```bash
npm run dev
```

## Access Points

- **Main App**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin
- **API Server**: http://localhost:3001

## Default Credentials

**Admin Panel:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change immediately after first login!**

## Verification

1. Open http://localhost:5000
2. Register a new user
3. Test messaging
4. Try Super AI chat
5. Access admin panel
6. Verify all features work

## Troubleshooting

### Server Won't Start
```bash
# Check ports
netstat -ano | findstr :3001
netstat -ano | findstr :5000

# Kill if needed
taskkill /PID <process_id> /F
```

### Database Issues
- Verify DATABASE_URL
- Check database is running
- Verify credentials
- Check migrations ran

### Admin Panel Not Loading
- Run: `npm run migrate:admin`
- Clear browser cache
- Check server logs
- Verify routes registered

## Next Steps

- [User Guide](USER_GUIDE.md)
- [Admin Guide](admin/ADMIN_GUIDE.md)
- [Feature Documentation](features/)
