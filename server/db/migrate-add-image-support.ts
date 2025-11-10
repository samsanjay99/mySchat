import { db } from '../db.js';
import { sql } from 'drizzle-orm';

async function migrateAddImageSupport() {
  console.log('Starting migration: Add image and file support to messages...');
  
  try {
    // Add new columns to messages table
    await db.execute(sql`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text',
      ADD COLUMN IF NOT EXISTS image_url TEXT,
      ADD COLUMN IF NOT EXISTS file_name TEXT,
      ADD COLUMN IF NOT EXISTS file_size INTEGER
    `);
    
    console.log('✓ Added message_type, image_url, file_name, and file_size columns to messages table');
    
    // Update existing messages to have message_type = 'text'
    await db.execute(sql`
      UPDATE messages 
      SET message_type = 'text' 
      WHERE message_type IS NULL
    `);
    
    console.log('✓ Updated existing messages with message_type = "text"');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateAddImageSupport()
  .then(() => {
    console.log('All migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
