import { db } from '../db.js';
import { users } from '@shared/schema.js';
import { eq } from "drizzle-orm";

async function fixSuperAIUser() {
  console.log("Fixing Super AI user assignment...");
  
  try {
    // First, remove isSuperAI flag from all users
    console.log("Step 1: Removing isSuperAI flag from all users...");
    await db
      .update(users)
      .set({ isSuperAI: false })
      .where(eq(users.isSuperAI, true));
    
    console.log("✓ Removed isSuperAI flag from all users");
    
    // Check if user ID 8 exists
    const [user8] = await db
      .select()
      .from(users)
      .where(eq(users.id, 8));
    
    if (!user8) {
      console.log("❌ User ID 8 does not exist. Looking for Super AI user by email...");
      
      // Try to find by email
      const [superAIByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, "super-ai@schat.app"));
      
      if (superAIByEmail) {
        console.log(`Found Super AI user by email with ID: ${superAIByEmail.id}`);
        console.log(`Setting isSuperAI = true for user ID ${superAIByEmail.id}...`);
        
        await db
          .update(users)
          .set({ isSuperAI: true })
          .where(eq(users.id, superAIByEmail.id));
        
        console.log(`✓ Successfully set user ID ${superAIByEmail.id} as Super AI`);
      } else {
        console.log("❌ No Super AI user found. Please run: npm run migrate:super-ai");
      }
    } else {
      // Set user ID 8 as Super AI
      console.log("Step 2: Setting user ID 8 as Super AI...");
      await db
        .update(users)
        .set({ isSuperAI: true })
        .where(eq(users.id, 8));
      
      console.log("✓ Successfully set user ID 8 as Super AI");
    }
    
    // Verify the change
    const [currentSuperAI] = await db
      .select()
      .from(users)
      .where(eq(users.isSuperAI, true));
    
    if (currentSuperAI) {
      console.log("\n✅ Super AI user is now:");
      console.log(`   ID: ${currentSuperAI.id}`);
      console.log(`   Name: ${currentSuperAI.fullName}`);
      console.log(`   Email: ${currentSuperAI.email}`);
      console.log(`   SchatId: ${currentSuperAI.schatId}`);
    } else {
      console.log("\n❌ No Super AI user found after migration");
    }
    
  } catch (error) {
    console.error("Error fixing Super AI user:", error);
    throw error;
  }
}

// Run the fix
fixSuperAIUser()
  .then(() => {
    console.log("\n✅ Fix completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fix failed:", error);
    process.exit(1);
  });
