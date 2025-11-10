# Fix Super AI User Assignment

## Problem
The Super AI responses are coming from the wrong user ID in the database. The `isSuperAI` flag is set on user ID 5 instead of the correct Super AI user (ID 8 or the user with email `super-ai@schat.app`).

## Solution

### Option 1: Run the Fix Script Locally (Recommended)

1. Make sure you have your database connection configured in `.env`:
   ```
   DATABASE_URL=your_database_url
   ```

2. Run the fix script:
   ```bash
   npm run fix:super-ai
   ```

3. The script will:
   - Remove the `isSuperAI` flag from all users
   - Set the correct user as Super AI (either ID 8 or the user with email `super-ai@schat.app`)
   - Verify the change

### Option 2: Manual Database Update

If you prefer to fix it manually in your database:

```sql
-- Remove isSuperAI flag from all users
UPDATE users SET is_super_ai = false WHERE is_super_ai = true;

-- Set the correct user as Super AI (replace 8 with your Super AI user ID)
UPDATE users SET is_super_ai = true WHERE id = 8;

-- Or if you know the email:
UPDATE users SET is_super_ai = true WHERE email = 'super-ai@schat.app';

-- Verify the change
SELECT id, full_name, email, schat_id, is_super_ai FROM users WHERE is_super_ai = true;
```

### Option 3: For Render Production Database

If you need to fix this on Render:

1. Go to your Render Dashboard
2. Select your PostgreSQL database
3. Click "Connect" and copy the connection string
4. Update your local `.env` with the production database URL
5. Run: `npm run fix:super-ai`

**OR** use Render's built-in SQL editor:
1. Go to your database in Render Dashboard
2. Click on "Query" tab
3. Run the SQL commands from Option 2 above

## Verification

After running the fix, verify by:

1. Check the database:
   ```sql
   SELECT id, full_name, email, schat_id, is_super_ai FROM users WHERE is_super_ai = true;
   ```

2. Test Super AI in your app:
   - Send a message to Super AI
   - Check that the response comes from the correct user ID

3. Check the API endpoint:
   ```
   GET https://myschat.onrender.com/api/super-ai/chat
   ```
   This should return the correct Super AI user information.

## Expected Result

After the fix:
- Only ONE user should have `is_super_ai = true`
- That user should be the one with email `super-ai@schat.app`
- Super AI responses should come from this user's ID
- The user should have:
  - Full Name: "Super AI"
  - SchatId: "SCHAT_superai"
  - Status: "I'm your AI assistant powered by advanced AI. Ask me anything!"
