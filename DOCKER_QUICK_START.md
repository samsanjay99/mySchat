# Docker Quick Start Guide

## 🚀 Test Locally Before Deploying

### Prerequisites
- Docker installed
- Docker Compose installed

### Quick Test (5 minutes)

**1. Build and Run:**
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

**2. Wait for Services:**
```
✅ postgres: healthy
✅ app: started
```

**3. Test Health Check:**
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T...",
  "uptime": 12.34
}
```

**4. Open in Browser:**
```
http://localhost:3001
```

**5. Test Super AI:**
- Login/Register
- Send message to Super AI
- Should get response (not error)

**6. Stop Services:**
```bash
# Stop and remove containers
docker-compose down

# Stop and remove everything (including volumes)
docker-compose down -v
```

## 🔧 Useful Commands

### View Logs
```bash
# All services
docker-compose logs

# Just app
docker-compose logs app

# Follow logs
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

### Check Status
```bash
# List running containers
docker-compose ps

# Check health
docker-compose ps app
```

### Access Shell
```bash
# App container
docker-compose exec app sh

# Database container
docker-compose exec postgres psql -U schat_user -d schat
```

### Rebuild
```bash
# Rebuild app only
docker-compose build app

# Rebuild and restart
docker-compose up -d --build app
```

### Clean Up
```bash
# Stop all
docker-compose down

# Remove volumes too
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3002:3001"
```

### Database Connection Failed
```bash
# Check database is healthy
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### App Crashes
```bash
# View app logs
docker-compose logs app

# Check environment variables
docker-compose exec app env | grep A4F

# Restart app
docker-compose restart app
```

## ✅ Verification Checklist

Before deploying to Render:
- [ ] `docker-compose up` works
- [ ] Health check returns 200
- [ ] Frontend loads
- [ ] Can register/login
- [ ] Super AI responds
- [ ] Image generation works
- [ ] No errors in logs

## 🎯 Next Steps

Once local testing works:
1. Push code to GitHub
2. Follow DOCKER_RENDER_DEPLOYMENT.md
3. Deploy to Render
4. Enjoy! 🎉

## 📝 Notes

### Environment Variables
- Defined in `docker-compose.yml`
- Override with `.env` file
- Production values set on Render

### Database
- PostgreSQL 15
- Data persists in volume
- Reset with `docker-compose down -v`

### Uploads
- Mounted as volume
- Persists between restarts
- Located in `./uploads`

---

**Quick Command:** `docker-compose up --build` → Test → `docker-compose down`
