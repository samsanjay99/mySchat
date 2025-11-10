import { users, chats, messages, otps, type User, type InsertUser, type Chat, type InsertChat, type Message, type InsertMessage, type ChatWithUsers, type MessageWithSender } from '@shared/schema.js';
import { db } from './db.js';
import { eq, and, or, desc, sql, asc } from "drizzle-orm";

export interface StorageInterface {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySchatId(schatId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void>;
  getSuperAIUser(): Promise<User | undefined>;
  
  // OTP operations
  storeOTP(email: string, otp: string): Promise<void>;
  verifyOTP(email: string, otp: string): Promise<boolean>;
  
  // Chat operations
  getOrCreateChat(user1Id: number, user2Id: number): Promise<Chat>;
  getUserChats(userId: number): Promise<ChatWithUsers[]>;
  getChatById(chatId: number, currentUserId?: number): Promise<ChatWithUsers | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getChatMessages(chatId: number): Promise<MessageWithSender[]>;
  updateMessageStatus(messageId: number, status: string): Promise<void>;
}

class Storage implements StorageInterface {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserBySchatId(schatId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.schatId, schatId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        schatId: "SCHAT_" + user.fullName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000)
      })
      .returning();
    
    return newUser;
  }

  async updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    if (isOnline) {
      await db
        .update(users)
        .set({ isOnline: true })
        .where(eq(users.id, id));
    } else {
    await db
      .update(users)
      .set({ 
          isOnline: false,
        lastSeen: new Date() 
      })
        .where(eq(users.id, id));
    }
  }

  async getOrCreateChat(user1Id: number, user2Id: number): Promise<Chat> {
    console.log(`getOrCreateChat: Creating chat between user1Id: ${user1Id} and user2Id: ${user2Id}`);
    
    // Check if chat already exists
    const [existingChat] = await db
      .select()
      .from(chats)
      .where(
        or(
          and(
            eq(chats.user1Id, user1Id),
            eq(chats.user2Id, user2Id)
          ),
          and(
            eq(chats.user1Id, user2Id),
            eq(chats.user2Id, user1Id)
          )
        )
      );

    if (existingChat) {
      console.log(`getOrCreateChat: Found existing chat with id: ${existingChat.id}`);
      return existingChat;
    }

    // Create new chat
    const [newChat] = await db
      .insert(chats)
      .values({
        user1Id,
        user2Id,
      })
      .returning();
    
    console.log(`getOrCreateChat: Created new chat with id: ${newChat.id}`);
    return newChat;
  }

  async getUserChats(userId: number): Promise<ChatWithUsers[]> {
    console.log(`getUserChats: Fetching chats for userId: ${userId}`);
    
    const userChats = await db
      .select({
        id: chats.id,
        user1Id: chats.user1Id,
        user2Id: chats.user2Id,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
      })
      .from(chats)
      .where(
        or(
          eq(chats.user1Id, userId),
          eq(chats.user2Id, userId)
        )
      );

    console.log(`getUserChats: Found ${userChats.length} raw chats for user`);

    const chatsWithUsers: ChatWithUsers[] = [];
    
    for (const chat of userChats) {
      // Skip self-chats (where user is chatting with themselves)
      if (chat.user1Id === chat.user2Id) {
        console.log(`getUserChats: Skipping self-chat with id: ${chat.id}`);
        continue;
      }
      
      const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
      const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
      
      // Skip if other user doesn't exist
      if (!otherUser) {
        console.log(`getUserChats: Skipping chat ${chat.id} - other user ${otherUserId} not found`);
        continue;
      }
      
      const latestMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chat.id))
        .orderBy(desc(messages.createdAt))
        .limit(20);
      
      const messagesWithSenders: MessageWithSender[] = [];
      
      for (const message of latestMessages) {
        const sender = message.senderId === userId ? currentUser : otherUser;
        messagesWithSenders.push({
          ...message,
          sender,
        });
      }

      // Always put the current user as user1 and other user as user2
      // This ensures the chat list displays the other user's name correctly
      chatsWithUsers.push({
        ...chat,
        user1: currentUser,
        user2: otherUser,
        messages: messagesWithSenders.sort((a, b) => 
          new Date(a.createdAt || new Date()).getTime() - new Date(b.createdAt || new Date()).getTime()
        ),
      });
    }

    console.log(`getUserChats: Returning ${chatsWithUsers.length} processed chats`);
    return chatsWithUsers;
  }

  async getChatById(chatId: number, currentUserId?: number): Promise<ChatWithUsers | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    
    if (!chat) return undefined;

    const [user1] = await db.select().from(users).where(eq(users.id, chat.user1Id));
    const [user2] = await db.select().from(users).where(eq(users.id, chat.user2Id));
    const chatMessages = await this.getChatMessages(chatId);
    
    // If currentUserId is provided, always return the current user as user1 and the other user as user2
    if (currentUserId) {
      if (chat.user1Id === currentUserId) {
        return {
          ...chat,
          user1,
          user2,
          messages: chatMessages,
        };
      } else {
        // Swap user1 and user2 if the current user is user2
        return {
          ...chat,
          user1: user2,
          user2: user1,
          messages: chatMessages,
        };
      }
    }
    
    // Default behavior (for backward compatibility)
    return {
      ...chat,
      user1,
      user2,
      messages: chatMessages,
    };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    return newMessage;
  }

  async updateMessageStatus(messageId: number, status: string): Promise<void> {
    await db
      .update(messages)
      .set({ status })
      .where(eq(messages.id, messageId));
  }
  
  async getChatMessages(chatId: number): Promise<MessageWithSender[]> {
    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));
    
    const messagesWithSenders: MessageWithSender[] = [];
    
    for (const message of chatMessages) {
      const [sender] = await db.select().from(users).where(eq(users.id, message.senderId));
      messagesWithSenders.push({
        ...message,
        sender,
      });
    }
    
    return messagesWithSenders;
  }

  async storeOTP(email: string, otp: string): Promise<void> {
    // Delete any existing OTPs for this email
    await db.delete(otps).where(eq(otps.email, email));
    
    // Calculate expiry time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    // Store new OTP
    await db.insert(otps).values({
      email,
      otp,
      expiresAt,
    });
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const [storedOTP] = await db
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.email, email),
          eq(otps.otp, otp)
        )
      );
    
    if (!storedOTP) {
      return false;
    }
    
    const now = new Date();
    const expiryDate = new Date(storedOTP.expiresAt);
    const isValid = now <= expiryDate;
    
    // Delete the OTP after verification attempt
      await db.delete(otps).where(eq(otps.id, storedOTP.id));
      
    if (isValid) {
      // Mark user as verified
      await db
        .update(users)
        .set({ isVerified: true })
        .where(eq(users.email, email));
    }
    
    return isValid;
  }

  async getSuperAIUser(): Promise<User | undefined> {
    const [superAIUser] = await db
      .select()
      .from(users)
      .where(eq(users.isSuperAI, true));
    
    return superAIUser;
  }
}

export const storage = new Storage();
