# Render Docker Deployment Guide

## Quick Setup

### Step 1: In Render Dashboard

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `https://github.com/samsanjay99/mySchat`

### Step 2: Configure Service

**Basic Settings:**
- **Name**: `schat-app` (or any name you prefer)
- **Region**: Oregon (or closest to you)
- **Branch**: `master`
- **Runtime**: **Docker** ⚠️ IMPORTANT: Select Docker, not Node
- **Plan**: Free

**Docker Settings:**
- **Dockerfile Path**: `./Dockerfile`
- **Docker Context**: `.` (root directory)

### Step 3: Environment Variables

Add these environment variables in Render:

**Required:**
```
NODE_ENV=production
PORT=3001
DATABASE_URL=<your-neon-database-url>
JWT_SECRET=<auto-generate-or-use-your-own>
```

**A4F API (Already in your .env):**
```
A4F_API_KEY=ddc-a4f-73b259b67d954d5087f48319b7673747
A4F_BASE_URL=https://api.a4f.co/v1
SUPER_AI_MODEL=provider-5/deepseek-r1-0528-qwen3-8b
FALLBACK_MODEL=provider-6/gemma-3-27b-instruct
```

**Firebase (Copy from your .env):**
```
VITE_FIREBASE_API_KEY=AIzaSyByfnkkszDUWWG2q-ukrw2CxNrLMQu4W54
VITE_FIREBASE_AUTH_DOMAIN=hellochat-99.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hellochat-99
VITE_FIREBASE_STORAGE_BUCKET=hellochat-99.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=963414169504
VITE_FIREBASE_APP_ID=1:963414169504:web:6594f77e74be5f8f73b6c5
VITE_FIREBASE_MEASUREMENT_ID=G-PSBP598P39
```

### Step 4: Advanced Settings

- **Health Check Path**: `/api/health`
- **Auto-Deploy**: Yes (enabled)

### Step 5: Deploy

Click **"Create Web Service"** and wait for deployment.

## What Docker Does

The Dockerfile will:
1. ✅ Install dependencies
2. ✅ Build the client (Vite)
3. ✅ Build the server (TypeScript)
4. ✅ Create `dist/index.js` entry point
5. ✅ Start the server on port 3001

## Verify Deployment

Once deployed, test:
```bash
# Health check
curl https://your-app.onrender.com/api/health

# Should return: {"status":"ok",...}
```

## Troubleshooting

**If build fails:**
- Check Render logs for specific errors
- Ensure all environment variables are set
- Verify DATABASE_URL is correct

**If app crashes:**
- Check runtime logs in Render dashboard
- Verify DATABASE_URL connection
- Check that port 3001 is used

## Why Docker?

Docker deployment is more reliable because:
- ✅ Consistent build environment
- ✅ All dependencies included
- ✅ Proper entry point handling
- ✅ Better for production

## Current Configuration

Your Dockerfile already:
- Uses Node 20 Alpine (lightweight)
- Multi-stage build (optimized)
- Health checks configured
- Runs on port 3001
- Entry point: `node dist/index.js`
