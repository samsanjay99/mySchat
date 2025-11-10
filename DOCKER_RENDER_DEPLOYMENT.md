# Docker Deployment on Render - Complete Guide

## 🐳 Why Docker?

Docker provides:
- ✅ **Consistent Environment**: Same setup everywhere
- ✅ **Isolated Dependencies**: No conflicts
- ✅ **Faster Builds**: Cached layers
- ✅ **Better Reliability**: Predictable behavior
- ✅ **Easy Debugging**: Test locally first

## 📋 Prerequisites

1. **GitHub Repository**: Your code pushed to GitHub
2. **Render Account**: Free account at https://render.com
3. **PostgreSQL Database**: Will be created on Render
4. **A4F API Key**: For Super AI functionality

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository

Make sure these files exist in your repo:

```
your-repo/
├── Dockerfile              ✅ Created
├── .dockerignore          ✅ Created
├── render-docker.yaml     ✅ Created
├── package.json           ✅ Exists
├── tsconfig.json          ✅ Exists
└── ... (rest of your code)
```

**Commit and push to GitHub:**
```bash
git add Dockerfile .dockerignore render-docker.yaml
git commit -m "Add Docker deployment configuration"
git push origin main
```

### Step 2: Create PostgreSQL Database on Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "PostgreSQL"

2. **Configure Database:**
   ```
   Name: schat-db
   Database: schat
   User: schat_user
   Region: Oregon (or closest to you)
   Plan: Free
   ```

3. **Create Database**
   - Click "Create Database"
   - Wait for provisioning (1-2 minutes)

4. **Copy Connection Details:**
   - Internal Database URL (for app)
   - External Database URL (for local testing)
   - Save these for later!

### Step 3: Create Web Service on Render

1. **Go to Render Dashboard**
   - Click "New +" → "Web Service"

2. **Connect Repository:**
   - Select "Build and deploy from a Git repository"
   - Click "Connect" next to your GitHub repo
   - If not listed, click "Configure account" to grant access

3. **Configure Service:**
   ```
   Name: schat-app
   Region: Oregon (same as database)
   Branch: main
   Runtime: Docker
   ```

4. **Important Settings:**
   ```
   Dockerfile Path: ./Dockerfile
   Docker Context: .
   Docker Command: (leave empty, uses CMD from Dockerfile)
   ```

5. **Instance Type:**
   ```
   Plan: Free
   ```

### Step 4: Set Environment Variables

Click "Advanced" → "Add Environment Variable" for each:

#### Required Variables:

```bash
# Node Environment
NODE_ENV=production
PORT=3001

# Database (paste from Step 2)
DATABASE_URL=postgresql://schat_user:password@hostname/schat

# JWT Secret (auto-generate or use your own)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# A4F API Configuration
A4F_API_KEY=ddc-a4f-73b259b67d954d5087f48319b7673747
A4F_BASE_URL=https://api.a4f.co/v1
SUPER_AI_MODEL=provider-5/gpt-4o-mini
FALLBACK_MODEL=provider-5/gpt-3.5-turbo

# Admin Configuration
ADMIN_EMAIL=admin@schat.com
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_FULL_NAME=System Administrator
```

#### How to Set Each Variable:

1. **DATABASE_URL:**
   - Copy "Internal Database URL" from your PostgreSQL database
   - Format: `postgresql://user:password@host/database`

2. **JWT_SECRET:**
   - Click "Generate" button on Render
   - Or use: `openssl rand -base64 32`

3. **ADMIN_PASSWORD:**
   - Use a strong password
   - Will be hashed on first run

4. **A4F_API_KEY:**
   - Use the provided key
   - Or get your own from https://a4f.co

### Step 5: Deploy

1. **Create Web Service:**
   - Click "Create Web Service"
   - Render will start building Docker image

2. **Monitor Build:**
   - Watch the logs in real-time
   - Build takes 5-10 minutes first time
   - Subsequent builds are faster (cached)

3. **Wait for "Live":**
   - Status changes from "Building" → "Deploying" → "Live"
   - Green checkmark appears

### Step 6: Run Database Migrations

1. **Open Shell:**
   - Go to your web service
   - Click "Shell" tab
   - Wait for shell to connect

2. **Run Migrations:**
   ```bash
   # Check if tables exist
   node -e "require('./dist/server/db/index.js')"
   
   # Run admin migration
   node dist/server/db/migrate-add-admin.js
   
   # Verify
   echo "Migrations complete!"
   ```

3. **Alternative: Use Render's "Run Command":**
   - Go to "Shell" tab
   - Run: `node dist/server/db/migrate-add-admin.js`

### Step 7: Test Your Deployment

1. **Get Your URL:**
   - Copy from Render dashboard
   - Format: `https://schat-app.onrender.com`

2. **Test Health Check:**
   ```bash
   curl https://your-app.onrender.com/api/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-11-08T...",
     "uptime": 123.45
   }
   ```

3. **Test Frontend:**
   - Open URL in browser
   - Should see your app

4. **Test Super AI:**
   - Login to app
   - Send message to Super AI
   - Should get response (not error)

5. **Test Image Generation:**
   - Send: `/create a beautiful sunset`
   - Should generate image

## 🔍 Troubleshooting

### Build Fails

**Error: "Cannot find module"**
```
Solution: Check package.json has all dependencies
Run: npm install
Commit: package-lock.json
```

**Error: "Docker build failed"**
```
Solution: Test Docker build locally
Run: docker build -t schat-test .
Check: Dockerfile syntax
```

### App Crashes on Start

**Check Logs:**
- Go to "Logs" tab
- Look for error messages

**Common Issues:**

1. **Database Connection Failed:**
   ```
   Error: connect ECONNREFUSED
   ```
   Solution: Check DATABASE_URL is correct

2. **Missing Environment Variable:**
   ```
   Error: A4F_API_KEY is not configured
   ```
   Solution: Add missing env var and redeploy

3. **Port Binding Error:**
   ```
   Error: EADDRINUSE
   ```
   Solution: Ensure PORT=3001 is set

### Super AI Not Working

**Check Logs for:**
```
[SuperAI] Configuration:
[SuperAI] A4F_API_KEY: Set (hidden for security)
```

**If Missing:**
1. Add A4F_API_KEY environment variable
2. Redeploy service
3. Test again

**If Still Failing:**
```bash
# Test API key in shell
curl -X POST https://api.a4f.co/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"provider-5/gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
```

## 📊 Monitoring

### View Logs

**Real-time:**
- Go to "Logs" tab
- Auto-refreshes

**Search Logs:**
```bash
# In Shell tab
grep "SuperAI" /var/log/app.log
grep "Error" /var/log/app.log
```

### Check Metrics

- Go to "Metrics" tab
- View:
  - CPU usage
  - Memory usage
  - Request count
  - Response times

### Health Checks

Render automatically checks:
- Endpoint: `/api/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

## 🔄 Updates & Redeployment

### Auto-Deploy (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Render Auto-Deploys:**
   - Detects push
   - Rebuilds Docker image
   - Deploys automatically

### Manual Deploy

1. **Go to Render Dashboard**
2. **Click "Manual Deploy"**
3. **Select "Deploy latest commit"**
4. **Wait for deployment**

### Rollback

1. **Go to "Events" tab**
2. **Find previous successful deploy**
3. **Click "Rollback to this deploy"**

## 🎯 Best Practices

### 1. Use Environment Variables
- Never hardcode secrets
- Use Render's env var management
- Keep sensitive data secure

### 2. Monitor Logs
- Check logs regularly
- Set up alerts for errors
- Monitor Super AI responses

### 3. Test Locally First
```bash
# Build Docker image
docker build -t schat-local .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL="your-db-url" \
  -e A4F_API_KEY="your-key" \
  schat-local

# Test
curl http://localhost:3001/api/health
```

### 4. Keep Dependencies Updated
```bash
# Check for updates
npm outdated

# Update safely
npm update

# Test locally
npm test

# Deploy
git push
```

### 5. Database Backups
- Render Free plan: No automatic backups
- Paid plan: Daily backups
- Manual backup: Use pg_dump

## 📝 Checklist

Before deploying:
- [ ] Dockerfile created
- [ ] .dockerignore created
- [ ] render-docker.yaml created
- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created
- [ ] Environment variables set
- [ ] Health check endpoint works
- [ ] Tested Docker build locally

After deploying:
- [ ] Service shows "Live" status
- [ ] Health check returns 200
- [ ] Frontend loads correctly
- [ ] Can login/register
- [ ] Super AI responds to text
- [ ] Image generation works
- [ ] Database migrations ran
- [ ] Admin account created

## 🎉 Success!

Your app should now be:
- ✅ Running on Render
- ✅ Using Docker for consistency
- ✅ Super AI working properly
- ✅ Database connected
- ✅ Auto-deploying on push
- ✅ Health checks passing

## 📞 Need Help?

### Check These First:
1. Render logs for errors
2. Health check endpoint
3. Environment variables
4. Database connection
5. Docker build locally

### Resources:
- Render Docs: https://render.com/docs
- Docker Docs: https://docs.docker.com
- This Guide: DOCKER_RENDER_DEPLOYMENT.md

### Common Issues:
- See RENDER_SUPER_AI_TROUBLESHOOTING.md
- Check Render status page
- Review recent changes

---

**Quick Start:** Push code → Create database → Create web service → Set env vars → Deploy! 🚀
