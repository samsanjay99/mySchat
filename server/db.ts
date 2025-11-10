import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from '@shared/schema.js';

neonConfig.webSocketConstructor = ws;

// Use a default connection URL if DATABASE_URL is not set (for development only)
const connectionString = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_Dq6rtzjQMpG9@ep-noisy-wind-a8ixyics-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });