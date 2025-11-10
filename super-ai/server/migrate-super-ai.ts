import { db } from '../../server/db.js';
import { users } from '@shared/schema.js';
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function createSuperAIUser() {
  console.log("Creating Super AI user...");
  
  // Check if Super AI user already exists
  const [existingSuperAI] = await db
    .select()
    .from(users)
    .where(eq(users.isSuperAI, true));
  
  if (existingSuperAI) {
    console.log("Super AI user already exists.");
    return;
  }
  
  // Create Super AI user
  const hashedPassword = await bcrypt.hash("super-ai-secure-password-" + Date.now(), 10);
  
  const [superAIUser] = await db
    .insert(users)
    .values({
      email: "super-ai@schat.app",
      password: hashedPassword,
      fullName: "Super AI",
      schatId: "SCHAT_superai",
      profileImageUrl: "/logo/superai-logo.png",
      status: "I'm your AI assistant powered by advanced AI. Ask me anything!",
      isOnline: true,
      isVerified: true,
      isSuperAI: true,
    })
    .returning();
  
  console.log("Super AI user created:", superAIUser);
}

// Run the migration
createSuperAIUser()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  }); 