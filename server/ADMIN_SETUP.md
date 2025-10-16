# 🔐 Admin User Setup

This guide will help you create an admin user for the VTU AI Notes Platform.

## 🚀 Quick Setup

### Option 1: Using the Script (Recommended)

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Run the admin creation script:**
   ```bash
   npm run create-admin
   ```

3. **Login with admin credentials:**
   - **Email:** `admin@vtu.edu`
   - **Password:** `admin123`

### Option 2: Manual Database Update

If you prefer to update an existing user:

1. **Connect to your MongoDB database**
2. **Update user role:**
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```

## 🔑 Admin Credentials

After running the script, you'll have these credentials:

- **Email:** `admin@vtu.edu`
- **Password:** `admin123`
- **Role:** `admin`
- **USN:** `1AD21AD001`

## ⚠️ Security Notes

1. **Change Password:** Immediately change the default password after first login
2. **Environment Variables:** Ensure your `.env` file has the correct `MONGODB_URI`
3. **Production:** Remove or secure this script in production environments

## 🎯 What You Can Do

With admin access, you can:
- View all users and their data
- Monitor system statistics
- Manage platform settings
- Access admin-only features

## 🚨 Troubleshooting

### Common Issues:

1. **Connection Error:** Check your MongoDB connection string in `.env`
2. **Permission Error:** Ensure MongoDB user has write permissions
3. **Script Not Found:** Make sure you're in the `server` directory

### Error Messages:

- `"Admin user already exists"` - Admin is already created
- `"Connection failed"` - Check MongoDB connection
- `"Permission denied"` - Check database user permissions

## 📞 Support

If you encounter issues:
1. Check MongoDB connection
2. Verify environment variables
3. Check console error messages
4. Ensure all dependencies are installed

---

**Happy Admin-ing! 🎉**
