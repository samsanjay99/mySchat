# 🔐 Environment Configuration Guide

Complete guide for setting up environment variables in Schat.

## 📋 Overview

Schat uses environment variables to securely store sensitive configuration like API keys, database credentials, and Firebase settings.

## 🔑 Required Environment Variables

### Database Configuration
```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```
- **Purpose**: PostgreSQL database connection string
- **Required**: Yes
- **Example**: Neon, Supabase, or any PostgreSQL database

### JWT Configuration
```env
JWT_SECRET=your_secure_secret_key_here
```
- **Purpose**: Secret key for JWT token signing
- **Required**: Yes
- **Security**: Use a strong, random string (min 32 characters)

### A4F API Configuration (AI Services)
```env
A4F_API_KEY=your_a4f_api_key_here
A4F_BASE_URL=https://api.a4f.co/v1
SUPER_AI_MODEL=provider-5/gpt-4o-mini
FALLBACK_MODEL=provider-5/gpt-3.5-turbo
```
- **Purpose**: AI chat and image generation
- **Required**: Yes (for Super AI features)
- **Get Key**: Sign up at A4F API service

### Firebase Configuration (Authentication)
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```
- **Purpose**: User authentication and email verification
- **Required**: Yes
- **Get Keys**: Firebase Console → Project Settings → General

## 📁 Environment Files

### `.env` (Development)
- Used for local development
- Contains all configuration
- **DO NOT COMMIT** to Git

### `.env.local` (Local Overrides)
- Overrides `.env` values
- For personal local settings
- **DO NOT COMMIT** to Git

### `.env.production.example` (Template)
- Template for production
- Safe to commit
- Copy to `.env.production` for production

## 🚀 Setup Instructions

### 1. Development Setup

```bash
# Copy the example file
cp .env.production.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

### 2. Configure Database

**Option A: Use Neon (Recommended)**
1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `.env`:
```env
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
```

**Option B: Use Local PostgreSQL**
```env
DATABASE_URL=postgresql://localhost:5432/schat
```

### 3. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Go to Project Settings → General
4. Scroll to "Your apps" section
5. Click "Web app" icon (</>) to create web app
6. Copy the configuration values
7. Add to `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
```

8. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Save changes

### 4. Configure A4F API

1. Sign up for A4F API service
2. Get your API key
3. Add to `.env`:
```env
A4F_API_KEY=ddc-a4f-your_key_here
```

### 5. Set JWT Secret

Generate a secure random string:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use any password generator
```

Add to `.env`:
```env
JWT_SECRET=your_generated_secure_key_here
```

## ✅ Verification

### Check Configuration
```bash
# Start the development server
npm run dev

# Check console for errors
# Should see: "Server running on port 3001"
# Should NOT see: "Firebase configuration is missing"
```

### Test Firebase
1. Go to http://localhost:5000
2. Try to register a new user
3. Should receive verification email
4. Should be able to login

### Test Database
1. Check server logs for database connection
2. Should see: "Database connected successfully"
3. Should NOT see: "Database connection error"

### Test AI Services
1. Go to Super AI chat
2. Send a message
3. Should receive AI response
4. Try `/create a sunset` for image generation

## 🔒 Security Best Practices

### DO:
✅ Use strong, random JWT secrets  
✅ Keep `.env` files in `.gitignore`  
✅ Use different keys for dev/prod  
✅ Rotate keys regularly  
✅ Use environment-specific configs  

### DON'T:
❌ Commit `.env` files to Git  
❌ Share API keys publicly  
❌ Use weak JWT secrets  
❌ Hardcode credentials in code  
❌ Use production keys in development  

## 🚨 Troubleshooting

### Firebase Configuration Error
```
Error: Firebase configuration is incomplete
```
**Solution**: Check all `VITE_FIREBASE_*` variables are set in `.env`

### Database Connection Error
```
Error: Connection refused
```
**Solution**: 
1. Check `DATABASE_URL` is correct
2. Verify database is running
3. Check network connectivity

### AI Service Error
```
Error: Invalid API key
```
**Solution**: 
1. Verify `A4F_API_KEY` is correct
2. Check API key is active
3. Verify account has credits

### JWT Error
```
Error: jwt malformed
```
**Solution**: 
1. Check `JWT_SECRET` is set
2. Clear browser cookies
3. Login again

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `A4F_API_KEY` | Yes | - | A4F API key for AI |
| `A4F_BASE_URL` | No | https://api.a4f.co/v1 | A4F API endpoint |
| `SUPER_AI_MODEL` | No | provider-5/gpt-4o-mini | Primary AI model |
| `FALLBACK_MODEL` | No | provider-5/gpt-3.5-turbo | Fallback AI model |
| `VITE_FIREBASE_API_KEY` | Yes | - | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | - | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | - | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | - | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | - | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | - | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | - | Firebase analytics ID |
| `NODE_ENV` | No | development | Environment mode |

## 🌐 Production Deployment

### Render / Heroku / Vercel
1. Go to your platform's dashboard
2. Navigate to Environment Variables
3. Add all variables from `.env.production.example`
4. Use production values (not development)
5. Deploy your application

### Docker
```dockerfile
# Use .env file
docker run --env-file .env your-image
```

### Manual Server
```bash
# Export variables
export DATABASE_URL="your_url"
export JWT_SECRET="your_secret"
# ... etc

# Or use .env file
source .env
npm start
```

## 📞 Support

### Need Help?
- Check [Setup Guide](SETUP.md)
- Review [Troubleshooting](#troubleshooting)
- Check server logs
- Verify all variables are set

### Common Issues
1. **Missing variables**: Check `.env` file exists
2. **Wrong values**: Verify credentials are correct
3. **Permission errors**: Check file permissions
4. **Connection errors**: Verify network/firewall

---

**Last Updated**: November 8, 2025  
**Version**: 2.0
