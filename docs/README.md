# Schat - WhatsApp Clone Documentation

Complete documentation for the Schat application - a full-featured WhatsApp clone with AI capabilities.

## 📚 Documentation Structure

### Main Guides
- **[Quick Start](QUICK_START.md)** - Get started in 5 minutes ⚡
- **[Setup Guide](SETUP.md)** - Complete installation and setup instructions
- **[User Guide](USER_GUIDE.md)** - How to use the application
- **[Deployment Guide](deployment/DEPLOYMENT.md)** - Deploy to production

### Features
- **[File Sharing](features/FILE_SHARING.md)** - Send images and files
- **[Super AI Chat](features/SUPER_AI.md)** - AI-powered conversations with image generation
- **[Responsive Design](features/RESPONSIVE_DESIGN.md)** - Mobile and desktop support

### Admin Panel
- **[Admin Guide](admin/ADMIN_GUIDE.md)** - Complete admin panel documentation
- **[Admin Quick Start](admin/QUICK_START.md)** - Get started quickly

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### First Time Setup

1. **Create Admin Account:**
   ```bash
   npm run create-admin
   ```

2. **Access the Application:**
   - Main App: http://localhost:5000
   - Admin Panel: http://localhost:5000/admin

3. **Register Users:**
   - Go to the landing page
   - Click "Get Started"
   - Sign up with email and password

## 🎯 Key Features

### Core Messaging
- ✅ Real-time chat with WebSocket
- ✅ User search by Schat ID
- ✅ Online/offline status
- ✅ Message read receipts
- ✅ Typing indicators

### File Sharing
- ✅ Image sharing with preview
- ✅ File attachments (any type)
- ✅ 5MB storage per user
- ✅ Storage management UI

### Super AI Chat
- ✅ AI-powered conversations
- ✅ Image generation (DALL-E, Stable Diffusion, Flux)
- ✅ Context-aware responses
- ✅ Dedicated AI chat interface

### Admin Panel
- ✅ User management
- ✅ Statistics dashboard with carousel
- ✅ Collapsible sidebar
- ✅ Search functionality
- ✅ Responsive design

### Responsive Design
- ✅ Mobile-first approach
- ✅ Desktop optimization
- ✅ Tablet support
- ✅ PWA-ready

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Wouter for routing
- TanStack Query for data fetching
- Shadcn/ui components

### Backend
- Express.js
- PostgreSQL with Drizzle ORM
- WebSocket for real-time features
- JWT authentication
- Multer for file uploads

### AI Integration
- OpenAI API (GPT-4, DALL-E)
- Replicate API (Stable Diffusion, Flux)
- Together AI (alternative models)

## 📖 Detailed Documentation

### For Users
- [Complete Setup Guide](SETUP.md)
- [User Guide](USER_GUIDE.md)
- [File Sharing Guide](features/FILE_SHARING.md)

### For Administrators
- [Admin Panel Guide](admin/ADMIN_GUIDE.md)
- [Admin Quick Start](admin/QUICK_START.md)

### For Developers
- [Feature Architecture](FEATURE_ARCHITECTURE.md)
- [Deployment Guide](deployment/DEPLOYMENT.md)

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/schat

# AI Services
OPENAI_API_KEY=your_openai_key
REPLICATE_API_TOKEN=your_replicate_token
TOGETHER_API_KEY=your_together_key

# Session
SESSION_SECRET=your_secret_key
```

## 📱 Supported Platforms

- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & iOS)
- ✅ Edge (Desktop)
- ✅ Samsung Internet

## 🤝 Support

For issues or questions:
1. Check the relevant documentation
2. Review the troubleshooting section
3. Check existing issues

## 📄 License

This project is for educational purposes.

---

**Version:** 2.0  
**Last Updated:** November 8, 2025
