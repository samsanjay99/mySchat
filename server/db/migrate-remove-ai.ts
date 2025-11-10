import { db } from '../db.js';
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running migration to remove AI-related tables and columns...");

  try {
    // Drop ai_chat_history table if it exists
    await db.execute(sql`
      DROP TABLE IF EXISTS ai_chat_history;
    `);
    console.log("✅ Dropped ai_chat_history table (if it existed)");

    // Find AI users by email or schatId
    await db.execute(sql`
      DELETE FROM messages 
      WHERE sender_id IN (
        SELECT id FROM users WHERE email = 'ai-assistant@schat.com' OR schat_id = 'ai-assistant'
      );
    `);
    console.log("✅ Deleted messages from AI users");
    
    // Delete messages in AI chats
    await db.execute(sql`
      DELETE FROM messages 
      WHERE chat_id IN (
        SELECT id FROM chats 
        WHERE user1_id IN (SELECT id FROM users WHERE email = 'ai-assistant@schat.com' OR schat_id = 'ai-assistant')
        OR user2_id IN (SELECT id FROM users WHERE email = 'ai-assistant@schat.com' OR schat_id = 'ai-assistant')
      );
    `);
    console.log("✅ Deleted messages in AI chats");
    
    // Delete AI chats
    await db.execute(sql`
      DELETE FROM chats 
      WHERE user1_id IN (SELECT id FROM users WHERE email = 'ai-assistant@schat.com' OR schat_id = 'ai-assistant')
      OR user2_id IN (SELECT id FROM users WHERE email = 'ai-assistant@schat.com' OR schat_id = 'ai-assistant');
    `);
    console.log("✅ Deleted AI chats");
    
    // Delete AI users
    await db.execute(sql`
      DELETE FROM users WHERE email = 'ai-assistant@schat.com' OR schat_id = 'ai-assistant';
    `);
    console.log("✅ Deleted AI users");

    // Remove isAIChat column from chats table if it exists
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'chats' AND column_name = 'is_ai_chat'
        ) THEN
          ALTER TABLE chats DROP COLUMN is_ai_chat;
        END IF;
      END $$;
    `);
    console.log("✅ Removed isAIChat column from chats table (if it existed)");

    // Remove isAI column from users table if it exists
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'is_ai'
        ) THEN
          ALTER TABLE users DROP COLUMN is_ai;
        END IF;
      END $$;
    `);
    console.log("✅ Removed isAI column from users table (if it existed)");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 