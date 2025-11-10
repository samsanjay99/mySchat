import { sql } from "drizzle-orm";
import { db } from '../../db.js';

async function main() {
  console.log("Adding firebaseUid column to users table...");
  
  try {
    // Add firebaseUid column
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;
    `);
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  }); 