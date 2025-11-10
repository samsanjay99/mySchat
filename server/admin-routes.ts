import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { adminService } from './admin-service.js';

const JWT_SECRET = process.env.JWT_SECRET || "schat_secret_key_2025_Sanjay99@";

interface AuthenticatedAdminRequest extends Request {
  adminId?: number;
  adminRole?: string;
}

// Middleware to authenticate admin requests
const authenticateAdmin = async (req: AuthenticatedAdminRequest, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No admin token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: number; role: string };
    
    req.adminId = decoded.adminId;
    req.adminRole = decoded.role;
    
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(401).json({ message: 'Invalid admin token' });
  }
};

export function registerAdminRoutes(app: express.Express): void {
  // Admin login
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find admin by username
      const admin = await adminService.getAdminByUsername(username);
      
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!admin.isActive) {
        return res.status(403).json({ message: "Admin account is disabled" });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, admin.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update last login
      await adminService.updateAdminLastLogin(admin.id);
      
      // Log login
      await adminService.logAdminAction({
        adminId: admin.id,
        action: 'login',
        details: JSON.stringify({ username }),
        ipAddress: req.ip,
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { adminId: admin.id, role: admin.role },
        JWT_SECRET,
        { expiresIn: "8h" }
      );
      
      res.json({
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get system statistics
  app.get("/api/admin/stats", authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const stats = await adminService.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to get statistics" });
    }
  });

  // Get all users
  app.get("/api/admin/users", authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const result = await adminService.getAllUsers(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Get user details
  app.get("/api/admin/users/:userId", authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const userDetails = await adminService.getUserDetails(userId);
      
      if (!userDetails) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(userDetails);
    } catch (error) {
      console.error("Get user details error:", error);
      res.status(500).json({ message: "Failed to get user details" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:userId", authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      await adminService.deleteUser(userId, req.adminId!, req.ip);
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Delete old messages
  app.post("/api/admin/cleanup/messages", authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const { daysOld } = req.body;
      
      if (!daysOld || daysOld < 1) {
        return res.status(400).json({ message: "Invalid daysOld parameter" });
      }
      
      const deletedCount = await adminService.deleteOldMessages(daysOld, req.adminId!, req.ip);
      
      res.json({
        message: `Deleted ${deletedCount} messages older than ${daysOld} days`,
        deletedCount,
      });
    } catch (error) {
      console.error("Delete old messages error:", error);
      res.status(500).json({ message: "Failed to delete old messages" });
    }
  });

  // Delete chat messages
  app.delete("/api/admin/chats/:chatId/messages", authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const chatId = parseInt(req.params.chatId);
      
      const deletedCount = await adminService.deleteChatMessages(chatId, req.adminId!, req.ip);
      
      res.json({
        message: `Deleted ${deletedCount} messages from chat`,
        deletedCount,
      });
    } catch (error) {
      console.error("Delete chat messages error:", error);
      res.status(500).json({ message: "Failed to delete chat messages" });
    }
  });

  // Clear expired OTPs
  app.post("/api/admin/cleanup/otps", authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const deletedCount = await adminService.clearExpiredOTPs(req.adminId!, req.ip);
      
      res.json({
        message: `Cleared ${deletedCount} expired OTPs`,
        deletedCount,
      });
    } catch (error) {
      console.error("Clear OTPs error:", error);
      res.status(500).json({ message: "Failed to clear OTPs" });
    }
  });

  // Get admin logs
  app.get("/api/admin/logs", authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const result = await adminService.getAdminLogs(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Get logs error:", error);
      res.status(500).json({ message: "Failed to get logs" });
    }
  });

  // Get user activity
  app.get("/api/admin/analytics/activity", authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const activity = await adminService.getUserActivity();
      res.json(activity);
    } catch (error) {
      console.error("Get activity error:", error);
      res.status(500).json({ message: "Failed to get activity" });
    }
  });

  // Get top users
  app.get("/api/admin/analytics/top-users", authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topUsers = await adminService.getTopUsers(limit);
      res.json(topUsers);
    } catch (error) {
      console.error("Get top users error:", error);
      res.status(500).json({ message: "Failed to get top users" });
    }
  });
}
