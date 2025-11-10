# 🛡️ Admin Panel - Quick Start Guide

## Access the Admin Panel

### Step 1: Navigate to Admin Login
Open your browser and go to:
```
http://localhost:5000/admin
```

### Step 2: Login with Default Credentials
```
Username: admin
Password: admin123
```

⚠️ **Change this password after first login!**

### Step 3: Explore the Dashboard
You'll see 4 main tabs:
1. **Overview** - System statistics and top users
2. **Users** - Manage all registered users
3. **Storage Cleanup** - Free up database space
4. **Activity Logs** - Audit trail of admin actions

## Common Tasks

### 🗑️ Free Up Storage Space

**Delete Old Messages:**
1. Click **Storage Cleanup** tab
2. Enter number of days (e.g., `30`)
3. Click **Delete Messages**
4. Confirm the action
5. ✅ Messages older than 30 days are deleted

**Clear Expired OTPs:**
1. Click **Storage Cleanup** tab
2. Click **Clear Expired OTPs**
3. ✅ All expired verification codes are removed

### 👥 Manage Users

**View All Users:**
1. Click **Users** tab
2. See list of all registered users
3. Check their status, join date, and activity

**Delete a User:**
1. Click **Users** tab
2. Find the user you want to remove
3. Click the **trash icon** (🗑️)
4. Confirm deletion
5. ✅ User and all their data are removed

### 📊 Monitor System

**View Statistics:**
1. Stay on **Overview** tab
2. See real-time stats:
   - Total users
   - Active users (24h)
   - Total messages
   - Images generated
   - Storage used

**Check Top Users:**
1. Scroll down on **Overview** tab
2. See most active users
3. View their message and image counts
4. Identify heavy users

### 📝 Review Activity

**View Admin Logs:**
1. Click **Activity Logs** tab
2. See all admin actions
3. Check who did what and when
4. Review detailed information

## Storage Management Strategy

### Weekly Maintenance
```
✓ Clear expired OTPs
✓ Check storage usage
✓ Review top users
```

### Monthly Cleanup
```
✓ Delete messages older than 30 days
✓ Remove inactive users (if needed)
✓ Review activity logs
```

### When Storage is Full
```
1. Delete messages older than 7 days
2. Delete messages older than 14 days
3. Delete messages older than 30 days
4. Contact users about storage limits
5. Consider upgrading database plan
```

## Quick Reference

| Task | Location | Action |
|------|----------|--------|
| Delete old messages | Storage Cleanup | Enter days → Delete |
| Clear OTPs | Storage Cleanup | Click Clear OTPs |
| Remove user | Users | Click trash icon |
| View stats | Overview | Auto-refreshes |
| Check logs | Activity Logs | View recent actions |

## Safety Tips

### Before Deleting
- ✅ Confirm you have the right user/data
- ✅ Understand the action is permanent
- ✅ Consider backing up if needed
- ✅ Review the confirmation dialog

### Best Practices
- 🔒 Keep admin credentials secure
- 📊 Monitor storage regularly
- 🗑️ Clean up periodically
- 📝 Review logs for suspicious activity
- ⚠️ Be cautious with deletions

## Troubleshooting

### Can't Login?
- Check username and password
- Clear browser cache
- Try incognito/private mode
- Check server is running

### Stats Not Showing?
- Wait for page to load
- Click refresh button
- Check browser console
- Verify server connection

### Delete Not Working?
- Confirm the action
- Check error messages
- Review server logs
- Verify admin permissions

## URLs

| Page | URL |
|------|-----|
| Admin Login | http://localhost:5000/admin |
| Dashboard | http://localhost:5000/admin/dashboard |
| Main App | http://localhost:5000 |

## Default Credentials

```
Username: admin
Password: admin123
Email: admin@schat.com
Role: super_admin
```

## Need More Help?

📖 Read the full guide: `ADMIN_PANEL_GUIDE.md`

---

**Quick Tip**: The admin panel auto-refreshes stats every 30 seconds, so you can leave it open to monitor your system in real-time!
