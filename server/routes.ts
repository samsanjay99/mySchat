import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from './storage.js';
import storageRoutes from './storage-routes.js';
// import nodemailer from "nodemailer";
import { db } from './db.js';
import { users } from '@shared/schema.js';
// import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { eq } from "drizzle-orm";
// import { sendOTPEmail } from './super-ai-service.js';
// import { v4 as uuidv4 } from "uuid";
// import { sendOTPEmail as newSendOTPEmail } from './super-ai-service.js';
import { getSuperAIResponse } from '../super-ai/server/super-ai-service.js';

// Define JWT_SECRET locally instead of importing it
const JWT_SECRET = process.env.JWT_SECRET || "schat_secret_key_2025_Sanjay99@";
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface AuthenticatedRequest extends Request {
  userId?: number;
}

// Middleware to authenticate requests
const authenticate = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log("Auth middleware: Token present:", !!token);
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    console.log("Auth middleware: Token verified successfully for userId:", decoded.userId);
    
    next();
  } catch (error) {
    console.error("Auth middleware: Token verification failed:", error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Check if JWT_SECRET is configured
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured. Set it in environment variables for security.");
  }
  
  // Health check endpoint for Render
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // Register storage routes
  app.use('/api/storage', storageRoutes);
  
  // WebSocket connected clients map (declared early so REST API can access it)
  interface ConnectedClient {
    ws: WebSocket;
    userId: number;
  }
  
  const connectedClients = new Map<number, ConnectedClient>();

  // User registration
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const userSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(2),
      });
      
      const validatedData = userSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        isVerified: false,
      });
      
      res.status(201).json({ 
        message: "Registration successful! Please verify your email.",
        userId: user.id,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Email verification
  app.post("/api/verify-email", async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }
      
      const isValid = await storage.verifyOTP(email, otp);
      
      if (isValid) {
        res.json({ 
          success: true, 
          message: "Email verified successfully. You can now login.",
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "Invalid or expired OTP. Please try again or request a new OTP.",
        });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Request OTP
  app.post("/api/request-otp", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      // Generate OTP (6-digit number)
      const otp = generateOTP();
      
      // Store OTP with expiration
      await storage.storeOTP(email, otp);
      
      // Send OTP to email (in a real app, you would use a proper email service)
      console.log(`New OTP for ${email}: ${otp}`); // For development only
      
      res.json({ message: "OTP sent successfully. Please check your email." });
    } catch (error) {
      console.error("OTP request error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // User login
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "No account found with this email. Please check and try again." });
      }
      
      // Check if email is verified
      if (!user.isVerified) {
        return res.status(403).json({ 
          message: "Email not verified. Please verify your email before logging in.",
          needsVerification: true,
          email: user.email
        });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Incorrect password. Please try again." });
      }
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "24h",
      });
      
      // Update user online status
      await storage.updateUserOnlineStatus(user.id, true);
      
      res.json({
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          schatId: user.schatId,
          profileImageUrl: user.profileImageUrl,
          status: user.status,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User logout
  app.post("/api/logout", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Update user online status
      await storage.updateUserOnlineStatus(req.userId!, false);
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current user
  app.get("/api/me", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("API /me: Authenticated request received for userId:", req.userId);
      const user = await storage.getUser(req.userId!);
      
      if (!user) {
        console.log("API /me: User not found for userId:", req.userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("API /me: Successfully retrieved user data for userId:", req.userId);
      res.json({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        schatId: user.schatId,
        profileImageUrl: user.profileImageUrl,
        status: user.status,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      });
    } catch (error) {
      console.error("API /me: Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get current user (alternative endpoint for client compatibility)
  app.get("/api/user/me", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("API /user/me: Authenticated request received for userId:", req.userId);
      const user = await storage.getUser(req.userId!);
      
      if (!user) {
        console.log("API /user/me: User not found for userId:", req.userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("API /user/me: Successfully retrieved user data for userId:", req.userId);
      res.json({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        schatId: user.schatId,
        profileImageUrl: user.profileImageUrl,
        status: user.status,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      });
    } catch (error) {
      console.error("API /user/me: Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Search users by schatId
  app.get("/api/users/search/:schatId", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { schatId } = req.params;
      const user = await storage.getUserBySchatId(schatId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the user's own profile in search
      if (user.id === req.userId) {
        return res.status(400).json({ message: "Cannot search for yourself" });
      }
      
      res.json({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        schatId: user.schatId,
        profileImageUrl: user.profileImageUrl,
        status: user.status,
        isOnline: user.isOnline,
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Get user chats
  app.get("/api/chats", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(`GET /api/chats: Fetching chats for userId: ${req.userId}`);
      const chats = await storage.getUserChats(req.userId!);
      console.log(`GET /api/chats: Returning ${chats.length} chats`);
      res.json(chats);
    } catch (error) {
      console.error("Get chats error:", error);
      res.status(500).json({ message: "Failed to get chats" });
    }
  });

  // Get a single chat by ID
  app.get("/api/chats/:chatId", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      const chat = await storage.getChatById(parseInt(chatId), req.userId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      res.json(chat);
    } catch (error) {
      console.error("Get chat error:", error);
      res.status(500).json({ message: "Failed to get chat" });
    }
  });

  // Create or get chat with another user
  app.post("/api/chats", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { otherUserId } = req.body;
      console.log(`POST /api/chats: Creating chat between userId: ${req.userId} and otherUserId: ${otherUserId}`);
      
      const chat = await storage.getOrCreateChat(req.userId!, otherUserId);
      console.log(`POST /api/chats: Chat created/retrieved with id: ${chat.id}`);
      
      const chatWithUsers = await storage.getChatById(chat.id, req.userId);
      console.log(`POST /api/chats: Returning chat with users`);
      
      res.json(chatWithUsers);
    } catch (error) {
      console.error("Create chat error:", error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  // Get chat messages
  app.get("/api/chats/:chatId/messages", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      const messages = await storage.getChatMessages(parseInt(chatId));
      
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Send message (REST API fallback)
  app.post("/api/messages", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chatId, content, imageUrl, fileName, fileSize, messageType } = req.body;
      
      const messageData: any = {
        chatId,
        senderId: req.userId!,
        content,
        status: 'sent',
      };
      
      // Add file-related fields if present
      if (messageType) {
        messageData.messageType = messageType;
      }
      if (imageUrl) {
        messageData.imageUrl = imageUrl;
      }
      if (fileName) {
        messageData.fileName = fileName;
      }
      if (fileSize) {
        messageData.fileSize = fileSize;
      }
      
      console.log('Creating message with data:', messageData);
      const message = await storage.createMessage(messageData);
      console.log('Message created:', message);
      
      // Get chat info to find recipient and broadcast via WebSocket
      const chat = await storage.getChatById(chatId);
      if (chat) {
        const recipientId = chat.user1Id === req.userId ? chat.user2Id : chat.user1Id;
        const sender = await storage.getUser(req.userId!);
        
        const messageWithSender = {
          ...message,
          sender,
        };
        
        // Send to recipient via WebSocket if online
        const recipientWs = connectedClients.get(recipientId);
        if (recipientWs && recipientWs.ws.readyState === WebSocket.OPEN) {
          console.log(`[REST API] Sending message to recipient ${recipientId} via WebSocket`);
          recipientWs.ws.send(JSON.stringify({
            type: 'new_message',
            message: messageWithSender,
          }));
          
          // Mark as delivered
          await storage.updateMessageStatus(message.id, 'delivered');
        } else {
          console.log(`[REST API] Recipient ${recipientId} is not connected via WebSocket`);
        }
        
        // Also send confirmation to sender if connected
        const senderWs = connectedClients.get(req.userId!);
        if (senderWs && senderWs.ws.readyState === WebSocket.OPEN) {
          console.log(`[REST API] Sending confirmation to sender ${req.userId} via WebSocket`);
          senderWs.ws.send(JSON.stringify({
            type: 'message_sent',
            message: messageWithSender,
          }));
        }
      }
      
      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Firebase auth integration
  app.post("/api/auth/firebase/create", async (req: Request, res: Response) => {
    try {
      const { email, fullName, firebaseUid } = req.body;
      
      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (user) {
        // Update existing user with Firebase UID if needed
        if (!user.isVerified) {
          await db
            .update(users)
            .set({
              isVerified: true,
            })
            .where(eq(users.email, email));
        }
      } else {
        // Create new user
        user = await storage.createUser({
          email,
          fullName,
          password: `firebase_auth_${firebaseUid}_${Date.now()}`, // Placeholder password
          isVerified: true,
        });
        
        // Mark as verified
        await db
          .update(users)
          .set({
            isVerified: true,
          })
          .where(eq(users.email, email));
      }
      
      res.status(201).json({ 
        message: "Account created or updated successfully",
        userId: user.id,
      });
    } catch (error) {
      console.error("Firebase create account error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/firebase/login", async (req: Request, res: Response) => {
    try {
      const { firebaseUid, email } = req.body;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ 
          message: "No account found. Please create an account first.",
          needsRegistration: true,
        });
      }
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "24h",
      });
      
      // Update user online status
      await storage.updateUserOnlineStatus(user.id, true);
      
      res.json({
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          schatId: user.schatId,
          profileImageUrl: user.profileImageUrl,
          status: user.status,
        },
      });
    } catch (error) {
      console.error("Firebase login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Super AI API Routes

  // Get or create Super AI chat
  app.get("/api/super-ai/chat", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(`[SuperAI Route] Getting Super AI chat for user ${req.userId}`);
      
      // Get Super AI user
      const superAIUser = await storage.getSuperAIUser();
      
      if (!superAIUser) {
        console.error(`[SuperAI Route] Super AI user not found`);
        return res.status(404).json({ message: "Super AI not available" });
      }
      
      console.log(`[SuperAI Route] Found Super AI user with id ${superAIUser.id}`);
      
      // Get or create chat with Super AI
      const chat = await storage.getOrCreateChat(req.userId!, superAIUser.id);
      console.log(`[SuperAI Route] Got or created chat with id ${chat.id}`);
      
      const chatWithUsers = await storage.getChatById(chat.id, req.userId);
      console.log(`[SuperAI Route] Retrieved chat with users and messages`);
      
      res.json({
        chat: chatWithUsers,
        aiUser: superAIUser
      });
    } catch (error) {
      console.error("Get Super AI chat error:", error);
      res.status(500).json({ message: "Failed to get Super AI chat" });
    }
  });

  // Send message to Super AI
  app.post("/api/super-ai/chat", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      console.log(`[SuperAI Route] Processing message from userId ${req.userId}: "${message.substring(0, 30)}..."`);
      
      // Get Super AI user
      const superAIUser = await storage.getSuperAIUser();
      
      if (!superAIUser) {
        console.error(`[SuperAI Route] Super AI user not found for request from userId ${req.userId}`);
        return res.status(404).json({ message: "Super AI not available" });
      }
      
      console.log(`[SuperAI Route] Found Super AI user with id ${superAIUser.id}`);
      
      // Get or create chat with Super AI
      const chat = await storage.getOrCreateChat(req.userId!, superAIUser.id);
      console.log(`[SuperAI Route] Using chat with id ${chat.id}`);
      
      // Save user message
      const userMessageData = {
        chatId: chat.id,
        senderId: req.userId!,
        content: message,
        status: 'sent',
      };
      
      console.log(`[SuperAI Route] Saving user message to database: ${JSON.stringify(userMessageData)}`);
      let savedUserMessage;
      try {
        savedUserMessage = await storage.createMessage(userMessageData);
        console.log(`[SuperAI Route] User message saved with id ${savedUserMessage.id}`);
      } catch (dbError) {
        console.error(`[SuperAI Route] Failed to save user message:`, dbError);
        return res.status(500).json({ message: "Failed to save user message to database" });
      }
      
      // Get AI response using the improved Super AI service
      console.log(`[SuperAI Route] Getting AI response from Super AI service`);
      let aiResponse;
      let isImageGeneration = false;
      let imageUrl = null;
      
      try {
        // Get response from Super AI service
        const startTime = Date.now();
        console.log(`[SuperAI Route] Starting API call at ${new Date().toISOString()}`);
        
        aiResponse = await getSuperAIResponse(req.userId!, message);
        
        // Check if this is an image generation request
        if (aiResponse.startsWith('IMAGE_GENERATION:')) {
          isImageGeneration = true;
          const prompt = aiResponse.substring(17); // Remove 'IMAGE_GENERATION:' prefix
          
          console.log(`[SuperAI Route] Image generation detected. Prompt: "${prompt}"`);
          
          // Import the generateImage function
          const { generateImage } = await import('../super-ai/server/super-ai-service.js');
          
          try {
            imageUrl = await generateImage(req.userId!, prompt);
            aiResponse = `I've created an image for you: "${prompt}"`;
            console.log(`[SuperAI Route] Image generated successfully: ${imageUrl}`);
          } catch (imageError: any) {
            console.error(`[SuperAI Route] Image generation failed:`, imageError);
            
            if (imageError.message.includes("Rate limit")) {
              aiResponse = "I'm receiving too many image generation requests right now. Please wait a moment before trying again.";
            } else if (imageError.message.includes("Empty prompt")) {
              aiResponse = "Please provide a description of the image you want me to create.";
            } else if (imageError.message.includes("Prompt too long")) {
              aiResponse = "Your image description is too long. Please keep it under 500 characters.";
            } else {
              aiResponse = "Sorry, I encountered an error while generating the image. Please try again later.";
            }
            
            isImageGeneration = false;
            imageUrl = null;
          }
        }
        
        const endTime = Date.now();
        console.log(`[SuperAI Route] API call completed in ${endTime - startTime}ms`);
        console.log(`[SuperAI Route] Received AI response: "${aiResponse.substring(0, 100)}..."`);
      } catch (aiError) {
        console.error(`[SuperAI Route] Error getting AI response:`, aiError);
        aiResponse = "Sorry, I encountered an error while processing your request. Please try again later.";
      }
      
      // Save AI response
      const aiMessageData: any = {
        chatId: chat.id,
        senderId: superAIUser.id,
        content: aiResponse,
        status: 'sent',
      };
      
      // Add image data if this is an image generation
      if (isImageGeneration && imageUrl) {
        aiMessageData.messageType = 'image';
        aiMessageData.imageUrl = imageUrl;
      }
      
      console.log(`[SuperAI Route] Saving AI response to database: ${JSON.stringify({
        ...aiMessageData,
        content: aiResponse.substring(0, 50) + '...'
      })}`);
      
      let aiMessage;
      try {
        aiMessage = await storage.createMessage(aiMessageData);
        console.log(`[SuperAI Route] AI message saved with id ${aiMessage.id}`);
      } catch (dbError) {
        console.error(`[SuperAI Route] Failed to save AI response:`, dbError);
        return res.status(500).json({ message: "Failed to save AI response to database" });
      }
      
      // Verify the message was saved correctly
      try {
        const savedMessages = await storage.getChatMessages(chat.id);
        const lastMessage = savedMessages[savedMessages.length - 1];
        
        if (lastMessage && lastMessage.id === aiMessage.id) {
          console.log(`[SuperAI Route] Verified last message in chat: id=${lastMessage.id}, content="${lastMessage.content.substring(0, 30)}..."`);
        } else {
          console.warn(`[SuperAI Route] Last message verification failed. Expected id=${aiMessage.id}, got id=${lastMessage?.id}`);
        }
        
        // Notify connected clients about the new message
        if (req.userId) {
          const client = connectedClients.get(req.userId);
          if (client) {
            console.log(`[SuperAI Route] Notifying client about new message`);
            client.ws.send(JSON.stringify({
              type: 'new_message',
              message: {
                ...aiMessage,
                sender: superAIUser
              }
            }));
          }
        }
      } catch (verifyError) {
        console.error(`[SuperAI Route] Error verifying saved message:`, verifyError);
        // Continue despite verification error
      }
      
      res.json({ 
        success: true, 
        message: aiMessage,
        userMessage: savedUserMessage
      });
    } catch (error) {
      console.error("[SuperAI Route] Error processing Super AI message:", error);
      res.status(500).json({ message: "Failed to send message to Super AI" });
    }
  });

  // Debug: Check recent messages in database (no auth for debugging)
  app.get("/api/debug/recent-messages/:chatId", async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      console.log(`[Debug] Fetching recent messages for chat ${chatId}`);
      
      const messages = await storage.getChatMessages(parseInt(chatId));
      
      res.json({
        success: true,
        chatId: parseInt(chatId),
        messageCount: messages.length,
        messages: messages.slice(-10).map(msg => ({
          id: msg.id,
          chatId: msg.chatId,
          senderId: msg.senderId,
          content: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
          status: msg.status,
          createdAt: msg.createdAt,
        })),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[Debug] Error fetching messages:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Fix Super AI user assignment
  app.post("/api/admin/fix-super-ai", async (req: Request, res: Response) => {
    try {
      console.log("[Admin] Fixing Super AI user assignment...");
      
      // First, remove isSuperAI flag from all users
      console.log("[Admin] Step 1: Removing isSuperAI flag from all users...");
      await db
        .update(users)
        .set({ isSuperAI: false })
        .where(eq(users.isSuperAI, true));
      
      console.log("[Admin] ✓ Removed isSuperAI flag from all users");
      
      // Try to find Super AI user by email first
      const [superAIByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, "super-ai@schat.app"));
      
      let superAIUserId: number;
      
      if (superAIByEmail) {
        console.log(`[Admin] Found Super AI user by email with ID: ${superAIByEmail.id}`);
        superAIUserId = superAIByEmail.id;
      } else {
        // Check if user ID 8 exists
        const [user8] = await db
          .select()
          .from(users)
          .where(eq(users.id, 8));
        
        if (user8) {
          console.log("[Admin] Using user ID 8 as Super AI");
          superAIUserId = 8;
        } else {
          return res.status(404).json({
            success: false,
            message: "No Super AI user found. Please run the migration first.",
            hint: "Run: npm run migrate:super-ai"
          });
        }
      }
      
      // Set the correct user as Super AI
      console.log(`[Admin] Step 2: Setting user ID ${superAIUserId} as Super AI...`);
      await db
        .update(users)
        .set({ isSuperAI: true })
        .where(eq(users.id, superAIUserId));
      
      console.log(`[Admin] ✓ Successfully set user ID ${superAIUserId} as Super AI`);
      
      // Verify the change
      const [currentSuperAI] = await db
        .select()
        .from(users)
        .where(eq(users.isSuperAI, true));
      
      if (currentSuperAI) {
        console.log("[Admin] ✅ Super AI user verified");
        res.json({
          success: true,
          message: "Super AI user fixed successfully",
          superAIUser: {
            id: currentSuperAI.id,
            fullName: currentSuperAI.fullName,
            email: currentSuperAI.email,
            schatId: currentSuperAI.schatId,
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to verify Super AI user after update"
        });
      }
      
    } catch (error) {
      console.error("[Admin] Error fixing Super AI user:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Debug route to check A4F API configuration
  app.get("/api/debug/a4f-config", async (req: Request, res: Response) => {
    try {
      const config = {
        apiKeyConfigured: !!process.env.A4F_API_KEY,
        apiKeyLength: process.env.A4F_API_KEY?.length || 0,
        apiKeyPrefix: process.env.A4F_API_KEY?.substring(0, 10) + '...',
        baseUrl: process.env.A4F_BASE_URL || 'Not set',
        primaryModel: process.env.SUPER_AI_MODEL || 'Not set',
        fallbackModel: process.env.FALLBACK_MODEL || 'Not set',
        nodeEnv: process.env.NODE_ENV,
      };
      
      console.log("[Debug] A4F Configuration:", config);
      
      res.json({
        success: true,
        config,
        message: "Configuration retrieved successfully"
      });
    } catch (error) {
      console.error("[Debug] Error checking configuration:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Debug route for Super AI
  app.get("/api/debug/super-ai-test", async (req: Request, res: Response) => {
    try {
      console.log("[Debug] Testing Super AI service directly");
      const testMessage = "Hello, this is a test message from the debug route";
      
      console.log(`[Debug] Sending test message: "${testMessage}"`);
      const startTime = Date.now();
      const response = await getSuperAIResponse(999, testMessage);
      const endTime = Date.now();
      
      console.log(`[Debug] Received response in ${endTime - startTime}ms: "${response}"`);
      
      res.json({
        success: true,
        message: testMessage,
        response: response,
        responseTime: endTime - startTime,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[Debug] Error testing Super AI service:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Debug route to test specific A4F model
  app.get("/api/debug/test-model/:model", async (req: Request, res: Response) => {
    try {
      const { model } = req.params;
      console.log(`[Debug] Testing A4F model directly: ${model}`);
      
      // Import OpenAI from the super-ai service
      const { OpenAI } = await import("openai");
      
      // Import the Super AI service to use its configuration
      const { getSuperAIResponse } = await import("../super-ai/server/super-ai-service.js");
      
      // Initialize the OpenAI client with A4F configuration from environment variables
      const client = new OpenAI({
        apiKey: process.env.A4F_API_KEY || "",
        baseURL: process.env.A4F_BASE_URL || "https://api.a4f.co/v1",
      });
      
      const testMessage = "Hello, can you tell me what model you are?";
      console.log(`[Debug] Sending test message to model ${model}: "${testMessage}"`);
      
      const startTime = Date.now();
      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: testMessage }
        ],
        max_tokens: 150
      });
      
      const endTime = Date.now();
      const response = completion.choices[0].message.content;
      
      console.log(`[Debug] Received response from model ${model} in ${endTime - startTime}ms: "${response}"`);
      
      res.json({
        success: true,
        model: model,
        message: testMessage,
        response: response,
        responseTime: endTime - startTime
      });
    } catch (error) {
      console.error(`[Debug] Error testing model ${req.params.model}:`, error);
      res.status(500).json({ 
        success: false, 
        model: req.params.model,
        error: error instanceof Error ? error.message : String(error),
        details: error
      });
    }
  });

  // Super AI monitoring endpoint
  app.get("/api/super-ai/stats", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Import the Super AI service from the correct location
      const { getRateLimitStats } = await import("../super-ai/server/super-ai-service.js");
      
      const stats = getRateLimitStats();
      
      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[Super AI Stats] Error getting stats:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let userId: number | null = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          // Authenticate WebSocket connection
          try {
            const decoded = jwt.verify(message.token, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
            connectedClients.set(userId, { ws, userId });
            
            // Update online status
            await storage.updateUserOnlineStatus(userId, true);
            
            ws.send(JSON.stringify({ type: 'auth_success' }));
          } catch (error) {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
            ws.close();
          }
        } else if (message.type === 'send_message' && userId) {
          // Handle new message
          const { chatId, content } = message;
          
          const newMessage = await storage.createMessage({
            chatId,
            senderId: userId,
            content,
            status: 'sent',
          });
          
          // Get chat info to find recipient
          const chat = await storage.getChatById(chatId);
          if (chat) {
            const recipientId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
            
            // Check if recipient is Super AI
            const recipient = await storage.getUser(recipientId);
            const isSuperAI = recipient?.isSuperAI === true;
            
            const messageWithSender = {
              ...newMessage,
              sender: await storage.getUser(userId),
            };
            
            // Send to sender (confirmation)
            ws.send(JSON.stringify({
              type: 'message_sent',
              message: messageWithSender,
            }));
            
            if (isSuperAI) {
              console.log(`[WebSocket] Message to Super AI detected. Chat ID: ${chatId}, Message ID: ${newMessage.id}`);
              
              // Set a timeout for AI response generation
              const aiResponseTimeout = setTimeout(async () => {
                console.error(`[WebSocket] AI response timeout for message ${newMessage.id}`);
                
                // Send timeout error message
                const timeoutMessage = await storage.createMessage({
                  chatId,
                  senderId: recipientId,
                  content: "I'm taking longer than expected to respond. Please try again in a moment.",
                  status: 'sent',
                });
                
                ws.send(JSON.stringify({
                  type: 'new_message',
                  message: {
                    ...timeoutMessage,
                    sender: recipient,
                  },
                }));
              }, 30000); // 30 second timeout
              
              try {
                // Get AI response using the Super AI service
                console.log(`[WebSocket] Getting AI response from Super AI service`);
                
                // Get response from Super AI service
                const startTime = Date.now();
                console.log(`[WebSocket] Starting AI response generation at ${new Date().toISOString()}`);
                
                let aiResponse = await getSuperAIResponse(userId, content);
                let isImageGeneration = false;
                let imageUrl = null;
                
                // Check if this is an image generation request
                if (aiResponse.startsWith('IMAGE_GENERATION:')) {
                  isImageGeneration = true;
                  const prompt = aiResponse.substring(17); // Remove 'IMAGE_GENERATION:' prefix
                  
                  console.log(`[WebSocket] Image generation detected. Prompt: "${prompt}"`);
                  
                  // Import the generateImage function
                  const { generateImage } = await import('../super-ai/server/super-ai-service.js');
                  
                  try {
                    imageUrl = await generateImage(userId, prompt);
                    aiResponse = `I've created an image for you: "${prompt}"`;
                    console.log(`[WebSocket] Image generated successfully: ${imageUrl}`);
                  } catch (imageError: any) {
                    console.error(`[WebSocket] Image generation failed:`, imageError);
                    
                    if (imageError.message.includes("Rate limit")) {
                      aiResponse = "I'm receiving too many image generation requests right now. Please wait a moment before trying again.";
                    } else if (imageError.message.includes("Empty prompt")) {
                      aiResponse = "Please provide a description of the image you want me to create.";
                    } else if (imageError.message.includes("Prompt too long")) {
                      aiResponse = "Your image description is too long. Please keep it under 500 characters.";
                    } else {
                      aiResponse = "Sorry, I encountered an error while generating the image. Please try again later.";
                    }
                    
                    isImageGeneration = false;
                    imageUrl = null;
                  }
                }
                
                const endTime = Date.now();
                console.log(`[WebSocket] AI response generated in ${endTime - startTime}ms`);
                console.log(`[WebSocket] AI response: "${aiResponse.substring(0, 50)}..."`);
                
                // Clear the timeout since we got a response
                clearTimeout(aiResponseTimeout);
                
                // Save AI response as a message
                const aiMessageData: any = {
                  chatId,
                  senderId: recipientId, // Super AI is the sender
                  content: aiResponse,
                  status: 'sent',
                };
                
                // Add image data if this is an image generation
                if (isImageGeneration && imageUrl) {
                  aiMessageData.messageType = 'image';
                  aiMessageData.imageUrl = imageUrl;
                }
                
                const aiMessage = await storage.createMessage(aiMessageData);
                
                console.log(`[WebSocket] AI response saved to database. Message ID: ${aiMessage.id}`);
                
                // Send AI response to the user
                ws.send(JSON.stringify({
                  type: 'new_message',
                  message: {
                    ...aiMessage,
                    sender: recipient,
                  },
                }));
                
                console.log(`[WebSocket] AI response sent to user. Message ID: ${aiMessage.id}`);
                
                // Update message status to delivered
                await storage.updateMessageStatus(aiMessage.id, 'delivered');
                
              } catch (aiError) {
                console.error(`[WebSocket] Error getting AI response:`, aiError);
                
                // Clear the timeout since we're handling the error
                clearTimeout(aiResponseTimeout);
                
                // Send error message as AI response
                const errorMessage = await storage.createMessage({
                  chatId,
                  senderId: recipientId,
                  content: "Sorry, I encountered an error while processing your request. Please try again later.",
                  status: 'sent',
                });
                
                ws.send(JSON.stringify({
                  type: 'new_message',
                  message: {
                    ...errorMessage,
                    sender: recipient,
                  },
                }));
                
                // Log the error for monitoring
                console.error(`[WebSocket] Super AI Error Details:`, {
                  userId,
                  chatId,
                  messageId: newMessage.id,
                  error: aiError instanceof Error ? aiError.message : String(aiError),
                  timestamp: new Date().toISOString()
                });
              }
            } else {
              // Regular user-to-user message
              const recipientWs = connectedClients.get(recipientId);
              
              // Send to recipient if online
              if (recipientWs) {
                recipientWs.ws.send(JSON.stringify({
                  type: 'new_message',
                  message: messageWithSender,
                }));
                
                // Mark as delivered
                await storage.updateMessageStatus(newMessage.id, 'delivered');
                
                // Send delivery status to sender
                ws.send(JSON.stringify({
                  type: 'message_delivered',
                  messageId: newMessage.id,
                }));
              }
            }
          }
        } else if (message.type === 'read_messages' && userId) {
          // Mark messages as read
          const { chatId } = message;
          
          // Get chat messages
          const chatMessages = await storage.getChatMessages(chatId);
          
          // Filter unread messages from other user
          const unreadMessages = chatMessages.filter(
            msg => msg.senderId !== userId && msg.status !== 'read'
          );
          
          // Mark each message as read
          for (const msg of unreadMessages) {
            await storage.updateMessageStatus(msg.id, 'read');
            
            // Notify sender if online
            const sender = connectedClients.get(msg.senderId);
            if (sender) {
              sender.ws.send(JSON.stringify({
                type: 'message_read',
                messageId: msg.id,
                chatId,
              }));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (userId) {
        // Update online status
        await storage.updateUserOnlineStatus(userId, false);
        
        // Remove from connected clients
        connectedClients.delete(userId);
      }
    });
  });

  return httpServer;
}