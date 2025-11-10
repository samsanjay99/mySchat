# Admin Panel Setup Guide

## Security Notice

Admin credentials are **NOT** hardcoded in the codebase. They are configured via environment variables.

## Environment Variables

Set these environment variables before running the admin migration:

```env
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_secure_password
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_FULLNAME=Administrator Name
```

## Default Values (if not set)

If environment variables are not provided:
- Username: `admin`
- Password: `changeme123`
- Email: `admin@schat.com`
- Full Name: `Administrator`

**⚠️ WARNING:** Always set custom credentials in production!

## Setup Instructions

### Local Development

1. Add to your `.env` file:
```env
ADMIN_USERNAME=sanjay
ADMIN_PASSWORD=Sanjay99@
ADMIN_EMAIL=sanjay@schat.com
ADMIN_FULLNAME=Sanjay
```

2. Run migration:
```bash
npm run migrate:admin
```

### Render Deployment

1. Go to Render Dashboard → Your Service → Environment
2. Add these variables:
   - `ADMIN_USERNAME` = `sanjay`
   - `ADMIN_PASSWORD` = `Sanjay99@`
   - `ADMIN_EMAIL` = `sanjay@schat.com`
   - `ADMIN_FULLNAME` = `Sanjay`

3. Run migration in Render Shell:
```bash
npm run migrate:admin
```

### Manual Database Update

If you need to update credentials directly in the database:

1. Generate password hash:
```bash
node generate-password-hash.js
```

2. Run SQL in your database:
```sql
UPDATE admin_users 
SET username = 'sanjay', 
    password = '$2b$10$...' -- Use hash from step 1
WHERE username = 'admin';
```

## Security Best Practices

1. ✅ Never commit `.env` files with real credentials
2. ✅ Use strong passwords (min 12 characters, mixed case, numbers, symbols)
3. ✅ Change default credentials immediately after first deployment
4. ✅ Use environment variables for all sensitive data
5. ✅ Rotate passwords regularly
6. ✅ Use different credentials for dev/staging/production

## Access Admin Panel

- Local: http://localhost:5000/admin
- Production: https://your-app.onrender.com/admin

## Troubleshooting

**Can't login with new credentials?**
- Verify environment variables are set correctly
- Check if migration ran successfully
- Manually update database using SQL query above

**Forgot password?**
- Generate new hash with `generate-password-hash.js`
- Update database directly with SQL

**Multiple admin users?**
- Check `admin_users` table in database
- Delete old users: `DELETE FROM admin_users WHERE username = 'old_username';`
