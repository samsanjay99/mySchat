# Admin Panel Guide

## Overview
The Schat Admin Panel provides comprehensive tools for managing users, monitoring system usage, and maintaining database storage. This panel is completely separate from the user interface and requires admin authentication.

## Access

### URL
```
http://localhost:5000/admin
```

### Default Credentials
```
Username: admin
Password: admin123
```

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## Features

### 1. Dashboard Overview

#### System Statistics
- **Total Users**: Number of registered users
- **Active Users**: Users active in the last 24 hours
- **Total Messages**: All messages sent
- **Images Generated**: AI-generated images count
- **Storage Used**: Estimated database storage in MB

#### Top Users
- View most active users by message count
- See image generation statistics per user
- Identify heavy users for monitoring

### 2. User Management

#### View All Users
- Paginated list of all registered users
- See user details:
  - Full name and email
  - Schat ID
  - Online/Offline status
  - Registration date
  - Verification status

#### Delete Users
- Remove users and all their data
- Deletes:
  - User account
  - All messages sent by user
  - All chats involving user
  - Associated OTPs
- Action is logged for audit trail
- ⚠️ **Cannot be undone!**

### 3. Storage Cleanup

#### Delete Old Messages
- Remove messages older than specified days
- Helps free up database storage
- Example: Delete messages older than 30 days
- Shows count of deleted messages
- Action is logged

#### Clear Expired OTPs
- Remove expired one-time passwords
- Cleans up verification codes
- Automatic cleanup of old data
- Shows count of cleared OTPs

### 4. Activity Logs

#### View Admin Actions
- Complete audit trail of admin activities
- Logged actions include:
  - Admin logins
  - User deletions
  - Message cleanups
  - OTP clearances
- Each log includes:
  - Admin who performed action
  - Action type
  - Detailed information (JSON)
  - IP address
  - Timestamp

## Usage Examples

### Example 1: Free Up Storage Space

1. Navigate to **Storage Cleanup** tab
2. Enter number of days (e.g., 30)
3. Click **Delete Messages**
4. Confirm the action
5. System will delete all messages older than 30 days
6. View updated storage statistics

### Example 2: Remove Inactive User

1. Go to **Users** tab
2. Find the user in the list
3. Click the **Delete** button (trash icon)
4. Confirm deletion
5. User and all their data will be removed
6. Action will be logged in Activity Logs

### Example 3: Monitor System Usage

1. Stay on **Overview** tab
2. View real-time statistics (auto-refreshes every 30 seconds)
3. Check **Top Users** section
4. Identify users with high activity
5. Take action if needed (contact user or delete)

## Security Features

### Authentication
- Separate admin authentication system
- JWT token-based sessions
- 8-hour session timeout
- Secure password hashing (bcrypt)

### Authorization
- Admin-only routes
- Token verification on every request
- Role-based access (admin, super_admin)
- IP address logging

### Audit Trail
- All admin actions are logged
- Cannot be deleted by admins
- Includes detailed information
- Timestamp and IP tracking

## Database Schema

### Admin Tables

#### admin_users
```sql
- id: Primary key
- username: Unique username
- password: Hashed password
- email: Admin email
- full_name: Full name
- role: admin or super_admin
- is_active: Account status
- last_login: Last login timestamp
- created_at: Account creation date
```

#### admin_logs
```sql
- id: Primary key
- admin_id: Reference to admin user
- action: Action type
- details: JSON details
- ip_address: IP address
- created_at: Action timestamp
```

#### system_stats
```sql
- id: Primary key
- total_users: User count
- total_messages: Message count
- total_chats: Chat count
- total_images: Image count
- storage_used_mb: Storage in MB
- last_updated: Last update time
```

## API Endpoints

### Authentication
```
POST /api/admin/login
Body: { username, password }
Response: { token, admin }
```

### Statistics
```
GET /api/admin/stats
Headers: Authorization: Bearer <token>
Response: { totalUsers, totalMessages, ... }
```

### User Management
```
GET /api/admin/users?page=1&limit=50
DELETE /api/admin/users/:userId
GET /api/admin/users/:userId
```

### Cleanup Operations
```
POST /api/admin/cleanup/messages
Body: { daysOld: 30 }

POST /api/admin/cleanup/otps
```

### Analytics
```
GET /api/admin/analytics/activity
GET /api/admin/analytics/top-users?limit=10
```

### Logs
```
GET /api/admin/logs?page=1&limit=50
```

## Best Practices

### Regular Maintenance
1. **Weekly**: Clear expired OTPs
2. **Monthly**: Delete old messages (30+ days)
3. **Quarterly**: Review top users and activity
4. **As Needed**: Remove spam or inactive users

### Storage Management
- Monitor storage usage regularly
- Set up alerts for high storage
- Delete old messages periodically
- Keep only necessary data

### Security
- Change default password immediately
- Use strong passwords
- Don't share admin credentials
- Review activity logs regularly
- Monitor for suspicious activity

### User Management
- Only delete users when necessary
- Warn users before deletion if possible
- Keep audit trail of deletions
- Document reasons for user removal

## Troubleshooting

### Cannot Login
- Verify credentials are correct
- Check if admin account is active
- Clear browser cache and cookies
- Check server logs for errors

### Stats Not Updating
- Click refresh button
- Check database connection
- Verify admin token is valid
- Check browser console for errors

### Cleanup Not Working
- Verify you have admin permissions
- Check if there are messages to delete
- Review error messages
- Check server logs

### Users Not Loading
- Check pagination parameters
- Verify database connection
- Check admin token validity
- Review network requests

## Migration

### Initial Setup
```bash
# Run admin migration
npx tsx server/db/migrate-add-admin.ts
```

This creates:
- Admin tables
- Default admin user
- System stats table

### Creating Additional Admins
Currently, admins must be created directly in the database. Future versions will include admin user management in the panel.

## Monitoring

### Key Metrics to Watch
1. **Storage Growth**: Monitor MB/day increase
2. **User Growth**: Track new registrations
3. **Message Volume**: Messages per day
4. **Image Generation**: AI usage patterns
5. **Active Users**: Daily/weekly active users

### Warning Signs
- Sudden spike in storage usage
- Unusual number of messages from one user
- Rapid user registration (possible spam)
- High image generation from single user
- Repeated failed login attempts

## Future Enhancements

### Planned Features
- [ ] Admin user management UI
- [ ] Password change functionality
- [ ] Email notifications for alerts
- [ ] Automated cleanup schedules
- [ ] Advanced analytics and charts
- [ ] Export data functionality
- [ ] Bulk user operations
- [ ] Custom report generation
- [ ] Real-time monitoring dashboard
- [ ] Storage usage alerts

## Support

### Getting Help
1. Check server logs: `npm run dev`
2. Review browser console
3. Check admin activity logs
4. Verify database connection
5. Review this documentation

### Common Issues
- **403 Forbidden**: Token expired, login again
- **401 Unauthorized**: Invalid credentials
- **500 Server Error**: Check server logs
- **Network Error**: Check API server is running

---

**Version**: 1.0.0  
**Last Updated**: November 7, 2025  
**Status**: Production Ready
