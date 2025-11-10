@echo off
REM Deploy to GitHub Script for Windows

echo 🚀 Preparing to deploy to GitHub...

REM Check if git is initialized
if not exist .git (
    echo 📦 Initializing git repository...
    git init
)

REM Add remote (will skip if already exists)
echo 🔗 Adding GitHub remote...
git remote add origin https://github.com/samsanjay99/mychat.git 2>nul

REM Add all files
echo 📝 Adding all files...
git add .

REM Commit
echo 💾 Committing changes...
git commit -m "Complete app with Docker deployment, faster AI models, file sharing, and admin dashboard"

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push -u origin main --force

echo.
echo ✅ Successfully pushed to GitHub!
echo.
echo 📋 Next Steps:
echo 1. Go to https://dashboard.render.com
echo 2. Create PostgreSQL database
echo 3. Create Web Service (Docker runtime)
echo 4. Set environment variables
echo 5. Deploy!
echo.
echo 📚 See RENDER_DEPLOYMENT_CHECKLIST.md for detailed steps
pause
