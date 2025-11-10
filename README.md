# 🚀 Schat - with AI and Image Genration

> A modern, full-featured messaging application with AI capabilities and admin tools

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Version](https://img.shields.io/badge/version-2.0-blue)]()

## 📖 Overview

**Schat** is a full-stack messaging application that combines WhatsApp-style messaging with powerful AI capabilities. Built with React, TypeScript, and PostgreSQL, it offers real-time communication, AI-powered chat assistance, image generation, and comprehensive admin tools.

## ✨ Key Features

### 💬 Messaging
- Real-time chat with WebSocket
- Message status tracking (sent/delivered/read)
- User search by Schat ID
- Online/offline status
- Typing indicators
- File sharing (images & documents)

### 🤖 Super AI
- AI-powered chatbot (GPT-4)
- Image generation with `/create` command
- Context-aware conversations
- Multiple AI models support

### 🛡️ Admin Panel
- User management
- System statistics dashboard
- Storage management
- Activity logging
- Analytics and insights

### 📱 Responsive Design
- Mobile-first approach
- Desktop optimization
- PWA-ready
- Works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# 3. Run migrations
npm run db:push
npm run migrate:super-ai
npm run migrate:admin

# 4. Start development server
npm run dev
```

### Access Points

- **Main App**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin (admin/admin123)

## 📚 Documentation

All documentation is organized in the `/docs` folder:

### Getting Started
- **[Setup Guide](docs/SETUP.md)** - Complete installation instructions
- **[User Guide](docs/USER_GUIDE.md)** - How to use the application
- **[Feature Architecture](docs/FEATURE_ARCHITECTURE.md)** - System architecture

### Features
- **[File Sharing](docs/features/FILE_SHARING.md)** - Send images and files
- **[Super AI](docs/features/SUPER_AI.md)** - AI chat and image generation
- **[Responsive Design](docs/features/RESPONSIVE_DESIGN.md)** - Mobile & desktop support

### Admin
- **[Admin Guide](docs/admin/ADMIN_GUIDE.md)** - Complete admin documentation
- **[Quick Start](docs/admin/QUICK_START.md)** - Get started quickly

### Deployment
- **[Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Deploy to production

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Wouter for routing
- TanStack Query for data fetching
- Shadcn/ui components

### Backend
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- WebSocket for real-time features
- JWT authentication
- Multer for file uploads

### AI Integration
- OpenAI API (GPT-4, DALL-E)
- Replicate API (Stable Diffusion, Flux)
- Together AI (alternative models)

## 📁 Project Structure

```
schat-whatsapp-clone2/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
│   └── index.html
├── server/              # Backend Express application
│   ├── db/              # Database migrations
│   ├── admin-service.ts # Admin business logic
│   ├── admin-routes.ts  # Admin API endpoints
│   ├── routes.ts        # Main API routes
│   └── index.ts         # Server entry point
├── shared/              # Shared TypeScript types
├── super-ai/            # Super AI module
├── docs/                # Documentation
│   ├── admin/           # Admin documentation
│   ├── features/        # Feature documentation
│   ├── deployment/      # Deployment guides
│   ├── SETUP.md         # Setup guide
│   └── USER_GUIDE.md    # User guide
└── README.md            # This file
```

## 🎯 Core Features

### Real-Time Messaging
- Instant message delivery via WebSocket
- Read receipts and typing indicators
- Online/offline status tracking
- Message history and persistence

### File Sharing
- Image sharing with preview
- Document attachments
- 5MB storage per user
- Storage management UI

### AI Chat
- Conversational AI powered by GPT-4
- Image generation with natural language
- Multiple AI model support
- Context-aware responses

### Admin Dashboard
- Real-time statistics
- User management tools
- Storage cleanup utilities
- Complete activity logging

## 🔒 Security

- JWT authentication with token expiry
- Bcrypt password hashing
- Role-based access control
- Input validation with Zod
- SQL injection prevention
- XSS protection
- Complete audit trail

## 📱 Supported Platforms

- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & iOS)
- ✅ Edge (Desktop)
- ✅ Samsung Internet

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Database
npm run db:push          # Run main migrations
npm run migrate:super-ai # Setup Super AI
npm run migrate:admin    # Setup admin panel
npm run admin:setup      # Run all admin setup

# Utilities
npm run create-admin     # Create admin account
npm run check            # Type check
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational purposes.

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for utility-first CSS
- Drizzle ORM for type-safe database access
- OpenAI for AI capabilities
- All open-source contributors

## 📞 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Review troubleshooting guides
- **Questions**: Check the user guide

---

**Version**: 2.0  
**Last Updated**: November 8, 2025  
**Status**: Production Ready ✅

Made with ❤️ by the Schat Team
