# 🚀 Render Deployment Guide

Deploy your application to Render using Blueprint in 10 minutes.

## 📋 Prerequisites

- [Render account](https://render.com) (free tier available)
- Code pushed to GitHub/GitLab/Bitbucket
- PostgreSQL database URL
- Environment variables ready (see `.env.render.template`)

---

## 🎯 Quick Deploy (Blueprint Method)

### Step 1: Prepare Environment Variables (3 min)

Generate JWT secret:
```bash
node generate-jwt-secret.js
```

Gather all required values from `.env.render.template`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - From command above
- `A4F_API_KEY` - Your A4F API key
- Firebase credentials (7 variables)

### Step 2: Update render.yaml (1 min)

Edit `render.yaml` and change the service name:
```yaml
services:
  - type: web
    name: your-app-name  # ← Change this
```

### Step 3: Deploy via Blueprint (2 min)

1. Push code to Git:
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **"New +"** → **"Blueprint"**
4. Connect your repository
5. Render auto-detects `render.yaml`
6. Click **"Apply"**

### Step 4: Configure Environment Variables (2 min)

In Render Dashboard → Your Service → Environment:

**Required:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<from-generate-jwt-secret>
A4F_API_KEY=<your-key>
VITE_FIREBASE_API_KEY=<your-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-domain>
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
VITE_FIREBASE_MEASUREMENT_ID=<your-measurement-id>
```

**Optional (has defaults):**
```env
A4F_BASE_URL=https://api.a4f.co/v1
SUPER_AI_MODEL=provider-5/gpt-4o
FALLBACK_MODEL=provider-2/gpt-3.5-turbo
```

Click **"Save Changes"**

### Step 5: Wait for Build (5-10 min)

Monitor build progress in Render Dashboard. First build takes longer.

### Step 6: Run Migrations (1 min)

After deployment succeeds:
1. Go to your service → **Shell** tab
2. Run: `npm run migrate`

### Step 7: Test Your App

Visit: `https://your-app-name.onrender.com`

Test:
- ✅ User registration
- ✅ User login
- ✅ Chat functionality
- ✅ Super AI chat

---

## 🗄️ Database Setup

### Option A: Render PostgreSQL (Free)
1. Dashboard → **"New +"** → **"PostgreSQL"**
2. Name: `your-app-db`
3. Plan: **Free**
4. Copy **"Internal Database URL"** (not External)

### Option B: External Database
Use Neon, Supabase, or any PostgreSQL provider.

**Important:** Use the internal/private connection string for better performance.

---

## 🔍 Health Check

Your app includes a health check at `/api/health`:

```bash
curl https://your-app-name.onrender.com/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67
}
```

---

## 🐛 Troubleshooting

### Build Fails
1. Check build logs in Render Dashboard
2. Verify build command includes `--include=dev`: `npm install --include=dev && npm run build`
3. Test locally: `npm run build`
4. Verify all dependencies in `package.json`

### App Crashes on Start
1. Check runtime logs
2. Verify all environment variables are set
3. Check `DATABASE_URL` format: `postgresql://user:pass@host:port/db`

### Database Connection Error
1. Use **Internal Database URL** for Render PostgreSQL
2. Verify database is running
3. Test connection string format

### Static Files 404
1. Verify build completed: check for `dist/public` folder
2. Check `start-prod.js` serves static files
3. Clear browser cache

### WebSocket Connection Fails
1. Verify client uses `wss://` (not `ws://`)
2. Check WebSocket path is `/ws`
3. Review CORS configuration

---

## 💰 Free Tier Info

**Includes:**
- ✅ 750 hours/month runtime
- ✅ Automatic HTTPS
- ✅ Continuous deployment
- ✅ 512 MB RAM

**Limitations:**
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold start: 30-60 seconds

**Upgrade to Starter ($7/month):**
- Always-on (no cold starts)
- 2 GB RAM
- Better performance

---

## 📊 Monitoring

**View Logs:**
Dashboard → Your Service → **Logs** tab

**View Metrics:**
Dashboard → Your Service → **Metrics** tab

**Set Alerts:**
Dashboard → Your Service → Settings → **Notifications**

---

## 🔒 Security Checklist

- ✅ Strong JWT_SECRET (use `generate-jwt-secret.js`)
- ✅ DATABASE_URL uses SSL/TLS
- ✅ All secrets in environment variables (not code)
- ✅ HTTPS enabled (automatic on Render)
- ✅ No `.env` files committed to Git

---

## 🔄 Continuous Deployment

After initial setup, Render auto-deploys on every push to your main branch.

**Disable auto-deploy:**
Dashboard → Your Service → Settings → **Build & Deploy** → Toggle off

**Manual deploy:**
Dashboard → Your Service → **Manual Deploy** → Deploy latest commit

---

## 🌐 Custom Domain

1. Dashboard → Your Service → Settings → **Custom Domain**
2. Add your domain
3. Update DNS records as shown
4. SSL certificate auto-provisions

---

## 📚 Useful Commands

**Local testing:**
```bash
npm run build          # Build for production
npm start             # Test production build
npm run migrate       # Run database migrations
```

**Render Shell:**
```bash
node --version        # Check Node version
env | grep DATABASE   # Check environment variables
npm run migrate       # Run migrations
df -h                 # Check disk usage
```

---

## 🆘 Support

- [Render Docs](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Render Status](https://status.render.com)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)

---

## 📝 Post-Deployment

- [ ] Test all features
- [ ] Set up monitoring
- [ ] Configure alerts
- [ ] Set up database backups
- [ ] Review security settings
- [ ] Add custom domain (optional)
- [ ] Update README with live URL

---

**Your app is ready to deploy! Follow the steps above and you'll be live in 10 minutes.** 🎉
