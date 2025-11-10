import { sql } from "drizzle-orm";
import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export async function up(db: any) {
  // Add isVerified column to users table
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN is_verified BOOLEAN DEFAULT false;
  `);

  // Create otps table
  await db.execute(sql`
    CREATE TABLE otps (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export async function down(db: any) {
  // Drop otps table
  await db.execute(sql`
    DROP TABLE IF EXISTS otps;
  `);
  
  // Remove isVerified column from users table
  await db.execute(sql`
    ALTER TABLE users
    DROP COLUMN IF EXISTS is_verified;
  `);
} 