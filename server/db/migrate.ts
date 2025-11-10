import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as m0002_add_verification from './migrations/0002_add_verification.js';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

// Use a default connection URL if DATABASE_URL is not set (for development only)
const connectionString = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_Dq6rtzjQMpG9@ep-noisy-wind-a8ixyics-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

async function main() {
  console.log("Starting migration...");
  
  try {
    const pool = new Pool({ connectionString });
    const db = drizzle(pool);
    
    // Apply the verification migration
    console.log("Applying email verification migration");
    await m0002_add_verification.up(db);
    
    console.log("Migrations completed successfully");
    await pool.end();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main(); 