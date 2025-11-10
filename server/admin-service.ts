import { db } from './db.js';
import { users, chats, messages, otps } from '@shared/schema.js';
import { adminUsers, adminLogs, systemStats, type AdminUser, type InsertAdminLog } from '@shared/admin-schema.js';
import { eq, sql, desc, count, and, gte } from 'drizzle-orm';

export class AdminService {
  // Get admin by username
  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin;
  }

  // Update admin last login
  async updateAdminLastLogin(adminId: number): Promise<void> {
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, adminId));
  }

  // Log admin action
  async logAdminAction(log: InsertAdminLog): Promise<void> {
    await db.insert(adminLogs).values(log);
  }

  // Get system statistics
  async getSystemStats(): Promise<any> {
    // Count users
    const [userCount] = await db.select({ count: count() }).from(users);
    
    // Count messages
    const [messageCount] = await db.select({ count: count() }).from(messages);
    
    // Count chats
    const [chatCount] = await db.select({ count: count() }).from(chats);
    
    // Count images
    const [imageCount] = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.messageType, 'image'));
    
    // Get active users (logged in within last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [activeUserCount] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.lastSeen, yesterday));
    
    // Estimate storage (rough calculation)
    // Assume average message is 100 bytes, images are tracked separately
    const estimatedStorageMB = Math.round(
      (messageCount.count * 0.0001) + // Messages
      (imageCount.count * 0.5) // Images (URLs only, actual images on A4F)
    );
    
    return {
      totalUsers: userCount.count,
      totalMessages: messageCount.count,
      totalChats: chatCount.count,
      totalImages: imageCount.count,
      activeUsers: activeUserCount.count,
      storageUsedMB: estimatedStorageMB,
      lastUpdated: new Date(),
    };
  }

  // Get all users with pagination
  async getAllUsers(page: number = 1, limit: number = 50): Promise<any> {
    const offset = (page - 1) * limit;
    
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        schatId: users.schatId,
        isOnline: users.isOnline,
        isVerified: users.isVerified,
        isSuperAI: users.isSuperAI,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    const [totalCount] = await db.select({ count: count() }).from(users);
    
    return {
      users: allUsers,
      total: totalCount.count,
      page,
      limit,
      totalPages: Math.ceil(totalCount.count / limit),
    };
  }

  // Get user details with message count
  async getUserDetails(userId: number): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) return null;
    
    // Count messages sent by user
    const [messageCount] = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.senderId, userId));
    
    // Count images sent by user
    const [imageCount] = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.senderId, userId),
        eq(messages.messageType, 'image')
      ));
    
    // Count chats user is part of
    const [chatCount] = await db
      .select({ count: count() })
      .from(chats)
      .where(sql`${chats.user1Id} = ${userId} OR ${chats.user2Id} = ${userId}`);
    
    return {
      ...user,
      messageCount: messageCount.count,
      imageCount: imageCount.count,
      chatCount: chatCount.count,
    };
  }

  // Delete user and all related data
  async deleteUser(userId: number, adminId: number, ipAddress?: string): Promise<void> {
    // Get user details for logging
    const user = await this.getUserDetails(userId);
    
    // Delete user's messages
    await db.delete(messages).where(eq(messages.senderId, userId));
    
    // Delete chats where user is participant
    await db.delete(chats).where(sql`${chats.user1Id} = ${userId} OR ${chats.user2Id} = ${userId}`);
    
    // Delete OTPs
    await db.delete(otps).where(eq(otps.email, user.email));
    
    // Delete user
    await db.delete(users).where(eq(users.id, userId));
    
    // Log action
    await this.logAdminAction({
      adminId,
      action: 'delete_user',
      details: JSON.stringify({
        userId,
        email: user.email,
        fullName: user.fullName,
        messagesDeleted: user.messageCount,
        chatsDeleted: user.chatCount,
      }),
      ipAddress,
    });
  }

  // Delete old messages (older than X days)
  async deleteOldMessages(daysOld: number, adminId: number, ipAddress?: string): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    // Count messages to be deleted
    const [countResult] = await db
      .select({ count: count() })
      .from(messages)
      .where(sql`${messages.createdAt} < ${cutoffDate}`);
    
    const deletedCount = countResult.count;
    
    // Delete old messages
    await db.delete(messages).where(sql`${messages.createdAt} < ${cutoffDate}`);
    
    // Log action
    await this.logAdminAction({
      adminId,
      action: 'delete_old_messages',
      details: JSON.stringify({
        daysOld,
        deletedCount,
        cutoffDate,
      }),
      ipAddress,
    });
    
    return deletedCount;
  }

  // Delete all messages from a specific chat
  async deleteChatMessages(chatId: number, adminId: number, ipAddress?: string): Promise<number> {
    // Count messages
    const [countResult] = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.chatId, chatId));
    
    const deletedCount = countResult.count;
    
    // Delete messages
    await db.delete(messages).where(eq(messages.chatId, chatId));
    
    // Log action
    await this.logAdminAction({
      adminId,
      action: 'delete_chat_messages',
      details: JSON.stringify({
        chatId,
        deletedCount,
      }),
      ipAddress,
    });
    
    return deletedCount;
  }

  // Get recent admin logs
  async getAdminLogs(page: number = 1, limit: number = 50): Promise<any> {
    const offset = (page - 1) * limit;
    
    const logs = await db
      .select({
        id: adminLogs.id,
        adminId: adminLogs.adminId,
        action: adminLogs.action,
        details: adminLogs.details,
        ipAddress: adminLogs.ipAddress,
        createdAt: adminLogs.createdAt,
        adminUsername: adminUsers.username,
        adminFullName: adminUsers.fullName,
      })
      .from(adminLogs)
      .leftJoin(adminUsers, eq(adminLogs.adminId, adminUsers.id))
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit)
      .offset(offset);
    
    const [totalCount] = await db.select({ count: count() }).from(adminLogs);
    
    return {
      logs,
      total: totalCount.count,
      page,
      limit,
      totalPages: Math.ceil(totalCount.count / limit),
    };
  }

  // Get user activity (messages per day for last 30 days)
  async getUserActivity(): Promise<any> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const activity = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as message_count,
        COUNT(DISTINCT sender_id) as active_users
      FROM messages
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    return activity.rows;
  }

  // Get top users by message count
  async getTopUsers(limit: number = 10): Promise<any> {
    const topUsers = await db.execute(sql`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.schat_id,
        COUNT(m.id) as message_count,
        COUNT(CASE WHEN m.message_type = 'image' THEN 1 END) as image_count
      FROM users u
      LEFT JOIN messages m ON u.id = m.sender_id
      WHERE u.is_super_ai = false
      GROUP BY u.id, u.full_name, u.email, u.schat_id
      ORDER BY message_count DESC
      LIMIT ${limit}
    `);
    
    return topUsers.rows;
  }

  // Clear all expired OTPs
  async clearExpiredOTPs(adminId: number, ipAddress?: string): Promise<number> {
    const now = new Date();
    
    // Count expired OTPs
    const [countResult] = await db
      .select({ count: count() })
      .from(otps)
      .where(sql`${otps.expiresAt} < ${now}`);
    
    const deletedCount = countResult.count;
    
    // Delete expired OTPs
    await db.delete(otps).where(sql`${otps.expiresAt} < ${now}`);
    
    // Log action
    await this.logAdminAction({
      adminId,
      action: 'clear_expired_otps',
      details: JSON.stringify({
        deletedCount,
      }),
      ipAddress,
    });
    
    return deletedCount;
  }
}

export const adminService = new AdminService();
