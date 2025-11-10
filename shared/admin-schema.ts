import { pgTable, text, serial, timestamp, boolean, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: varchar("role", { length: 20 }).default("admin"), // admin, super_admin
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin activity logs
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminUsers.id),
  action: text("action").notNull(), // login, delete_messages, delete_user, etc.
  details: text("details"), // JSON string with action details
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System stats (cached for performance)
export const systemStats = pgTable("system_stats", {
  id: serial("id").primaryKey(),
  totalUsers: integer("total_users").default(0),
  totalMessages: integer("total_messages").default(0),
  totalChats: integer("total_chats").default(0),
  totalImages: integer("total_images").default(0),
  storageUsedMB: integer("storage_used_mb").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true,
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type SystemStats = typeof systemStats.$inferSelect;
