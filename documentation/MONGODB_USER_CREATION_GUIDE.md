# MongoDB Atlas Database User Creation Guide

This guide will help you create a proper database user for your application to resolve the "bad auth: Authentication failed" error.

## Why You Need a Database User

You cannot use your MongoDB Atlas account credentials to connect to your database. You must create a dedicated database user with specific permissions.

## Step-by-Step Instructions

### 1. Log in to MongoDB Atlas

1. Go to https://cloud.mongodb.com/
2. Log in with your Atlas account credentials

### 2. Navigate to Database Access

1. In the left sidebar, select your organization and project if you have multiple
2. Click on "Database Access" under the "Security" section

### 3. Add a New Database User

1. Click the "Add New Database User" button
2. Select "Password" as the authentication method
3. Enter a username (e.g., `ai_notes_app_user`)
4. Enter a password:
   - Use a strong password
   - For simplicity, avoid special characters like `@`, `:`, `/`, etc.
   - Example: `notesAppPassword123`
5. Set permissions:
   - Select "Atlas admin" for full access
   - OR select "Read and write to any database" for more restricted access
6. Click "Add User"

### 4. Whitelist Your IP Address

1. In the left sidebar, click "Network Access" under "Security"
2. Click "Add IP Address"
3. Either:
   - Click "Add Current IP Address" to add your current IP
   - Or add `0.0.0.0/0` to allow access from anywhere (NOT recommended for production)
4. Click "Confirm"

### 5. Update Your Connection String

After creating the database user, update your [server/.env](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env) file:

```
MONGO_URI=mongodb+srv://ai_notes_app_user:notesAppPassword123@vtunote.apgqtmi.mongodb.net/ai_notes?retryWrites=true&w=majority&appName=VTUNote
```

### 6. Test the Connection

1. Save your [server/.env](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env) file
2. Restart your server
3. Run `npm run test-atlas` from the server directory

## Common Issues and Solutions

### Issue: "Authentication failed" after creating user
- Double-check the username and password
- Ensure there are no extra spaces
- Make sure you're using the database user credentials, not your Atlas account credentials

### Issue: "IP address not whitelisted"
- Add your current IP address to the Network Access list
- For development, you can temporarily use `0.0.0.0/0` but remove it for production

### Issue: "User not found"
- Make sure you clicked "Add User" after filling the form
- Wait a few minutes for the user to be fully created

## Example Configuration

```
# In server/.env
MONGO_URI=mongodb+srv://ai_notes_app_user:notesAppPassword123@vtunote.apgqtmi.mongodb.net/ai_notes?retryWrites=true&w=majority&appName=VTUNote
JWT_SECRET=your_jwt_secret_key
# ... other variables
```

## Security Best Practices

1. Use a unique password for your database user
2. Limit permissions to only what's needed
3. Don't use your Atlas account credentials for database connections
4. Regularly rotate your database user passwords
5. Restrict IP access to only necessary addresses in production

## Need More Help?

If you continue to have issues:

1. Check that your cluster is not paused
2. Verify your cluster name in the connection string matches exactly
3. Refer to [MONGODB_ATLAS_TROUBLESHOOTING.md](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/MONGODB_ATLAS_TROUBLESHOOTING.md) for more detailed troubleshooting
4. Run `node get-atlas-connection-string.js` for step-by-step guidance on getting your connection string