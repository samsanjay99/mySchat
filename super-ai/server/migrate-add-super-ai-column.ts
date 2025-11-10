import { db } from '../../server/db.js';
import { sql } from "drizzle-orm";

async function addSuperAIColumn() {
  console.log("Adding isSuperAI column to users table...");
  
  try {
    // Check if column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_super_ai'
    `);
    
    if (result.rows.length > 0) {
      console.log("Column is_super_ai already exists.");
      return;
    }
    
    // Add the column
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN is_super_ai BOOLEAN DEFAULT FALSE
    `);
    
    console.log("Column is_super_ai added successfully.");
  } catch (error) {
    console.error("Error adding is_super_ai column:", error);
    throw error;
  }
}

// Run the migration
addSuperAIColumn()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  }); 