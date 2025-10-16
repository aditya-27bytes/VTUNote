# MongoDB Atlas Connection Fix Guide

## Current Issue

You're experiencing this error:
```
❌ MongoDB error: MongoServerError: bad auth : Authentication failed.
```

This error occurs because you're using your MongoDB Atlas account credentials instead of a dedicated database user.

## Solution Applied

I've updated your connection string to use placeholder values that remind you to use database user credentials.

## Steps to Fix Authentication

### 1. Create a Database User in MongoDB Atlas

1. Go to https://cloud.mongodb.com/
2. Select your project/cluster
3. In the left sidebar, click "Database Access"
4. Click "Add New Database User"
5. Choose "Password" as the authentication method
6. Enter a username (e.g., `ai_notes_user`)
7. Enter a strong password **without special characters** for simplicity (e.g., `notesPassword123`)
8. Set permissions to "Atlas admin" or "Read and write to any database"
9. Click "Add User"

### 2. Update Your Connection String

Update your [server/.env](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env) file with the correct credentials:

```
MONGO_URI=mongodb+srv://ai_notes_user:notesPassword123@vtunote.apgqtmi.mongodb.net/ai_notes?retryWrites=true&w=majority&appName=VTUNote
```

### 3. Whitelist Your IP Address

1. In MongoDB Atlas, go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Either:
   - Add your current IP (click "Add Current IP Address")
   - Or for development, add `0.0.0.0/0` to allow all IPs (NOT recommended for production)

### 4. Verify Cluster Status

1. In MongoDB Atlas, go to "Clusters"
2. Make sure your cluster status is "Idle" (not "Paused")
3. If it's paused, click "Resume"

## Testing Your Connection

After making these changes:

1. Save your [server/.env](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env) file
2. Restart your server
3. Run the test: `npm run test-atlas` from the server directory

## Common Mistakes to Avoid

1. ❌ Using your MongoDB Atlas account password instead of database user password
2. ❌ Not creating a database user at all
3. ❌ Not whitelisting your IP address
4. ❌ Using a paused cluster
5. ❌ Incorrect cluster URL

## Example of Correct Configuration

```
# In server/.env
MONGO_URI=mongodb+srv://ai_notes_user:notesPassword123@vtunote.apgqtmi.mongodb.net/ai_notes?retryWrites=true&w=majority&appName=VTUNote
JWT_SECRET=your_jwt_secret_key
# ... other variables
```

## Need More Help?

Refer to:
- [MONGODB_ATLAS_SETUP.md](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/MONGODB_ATLAS_SETUP.md) for setup instructions
- [MONGODB_ATLAS_TROUBLESHOOTING.md](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/MONGODB_ATLAS_TROUBLESHOOTING.md) for detailed troubleshooting
- Run `node get-atlas-connection-string.js` for step-by-step guidance