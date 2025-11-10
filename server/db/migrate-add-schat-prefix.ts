import { db } from '../db.js';
import { users } from '@shared/schema.js';
import { eq, sql } from "drizzle-orm";

async function updateSchatIdsWithPrefix() {
  console.log("Updating SchatIDs to include SCHAT_ prefix...");
  
  // Get all users without SCHAT_ prefix
  const usersToUpdate = await db
    .select()
    .from(users)
    .where(
      sql`${users.schatId} NOT LIKE 'SCHAT\\_%'`
    );
  
  console.log(`Found ${usersToUpdate.length} users to update`);
  
  // Update each user's schatId
  for (const user of usersToUpdate) {
    const newSchatId = `SCHAT_${user.schatId}`;
    console.log(`Updating user ${user.id} (${user.fullName}): ${user.schatId} -> ${newSchatId}`);
    
    await db
      .update(users)
      .set({ schatId: newSchatId })
      .where(eq(users.id, user.id));
  }
  
  console.log("SchatID update complete!");
}

// Run the migration
updateSchatIdsWithPrefix()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  }); 