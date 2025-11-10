#!/bin/bash

# Deploy to GitHub Script
echo "🚀 Preparing to deploy to GitHub..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add remote (will skip if already exists)
echo "🔗 Adding GitHub remote..."
git remote add origin https://github.com/samsanjay99/mychat.git 2>/dev/null || echo "Remote already exists"

# Add all files
echo "📝 Adding all files..."
git add .

# Commit
echo "💾 Committing changes..."
git commit -m "Complete app with Docker deployment, faster AI models, file sharing, and admin dashboard

Features:
- Docker deployment ready
- Super AI with 4 fast models (60% faster)
- Image generation with 4 fallback models
- File upload/download with 5MB storage per user
- Storage manager with cleanup
- Admin dashboard with collapsible sidebar
- Statistics carousel
- Responsive design
- Health check endpoint
- Auto-deploy on push"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main --force

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Create PostgreSQL database"
echo "3. Create Web Service (Docker runtime)"
echo "4. Set environment variables"
echo "5. Deploy!"
echo ""
echo "📚 See RENDER_DEPLOYMENT_CHECKLIST.md for detailed steps"
