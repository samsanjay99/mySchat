import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function migrateAddAdmin() {
  console.log('Starting migration: Add admin panel tables...');
  
  try {
    // Create admin_users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Created admin_users table');
    
    // Create admin_logs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES admin_users(id),
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Created admin_logs table');
    
    // Create system_stats table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_stats (
        id SERIAL PRIMARY KEY,
        total_users INTEGER DEFAULT 0,
        total_messages INTEGER DEFAULT 0,
        total_chats INTEGER DEFAULT 0,
        total_images INTEGER DEFAULT 0,
        storage_used_mb INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Created system_stats table');
    
    // Create default admin user from environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@schat.com';
    const adminFullName = process.env.ADMIN_FULLNAME || 'Administrator';
    
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await db.execute(sql`
      INSERT INTO admin_users (username, password, email, full_name, role)
      VALUES (${adminUsername}, ${hashedPassword}, ${adminEmail}, ${adminFullName}, 'super_admin')
      ON CONFLICT (username) DO NOTHING
    `);
    console.log(`✓ Created default admin user (username: ${adminUsername})`);
    
    // Initialize system stats
    await db.execute(sql`
      INSERT INTO system_stats (id, total_users, total_messages, total_chats, total_images, storage_used_mb)
      VALUES (1, 0, 0, 0, 0, 0)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✓ Initialized system stats');
    
    console.log('\n=== Migration completed successfully! ===');
    console.log('Admin panel ready at: http://localhost:5000/admin');
    console.log('\n⚠️  Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables for custom credentials');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateAddAdmin()
  .then(() => {
    console.log('All migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
