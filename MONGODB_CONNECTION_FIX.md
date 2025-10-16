# MongoDB Atlas Connection Fix Guide

## Current Issue

You're experiencing this error:
```
❌ MongoDB error: Error: querySrv ENOTFOUND _mongodb._tcp.27
```

This error occurs because your MongoDB username contains special characters that aren't properly URL encoded.

## Solution Applied

I've properly encoded the special characters in your username:
- `:` → `%3A`
- [@](file://d:\College%20Major%20Project\Final_Working_Repo\Final%20-%20Copy%20(2)\Final%20-%20Copy\ai-notes-platform\test-login.js#L0-L0) → `%40`

So `adityasanjaychougale:aditya@27` becomes `adityasanjaychougale%3Aaditya%4027`.

## Steps to Fix Authentication (If Still Getting Auth Errors)

If you're now getting authentication errors instead of the DNS error, it's likely because you're using your MongoDB Atlas account credentials instead of a dedicated database user.

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
5. ❌ Not properly encoding special characters in usernames/passwords

## Special Character Encoding Reference

If your username or password contains special characters, you MUST URL encode them:

| Character | URL Encoded |
|-----------|-------------|
| `@`       | `%40`       |
| `:`       | `%3A`       |
| `/`       | `%2F`       |
| `?`       | `%3F`       |
| `#`       | `%23`       |
| `[`       | `%5B`       |
| `]`       | `%5D`       |
| `%`       | `%25`       |

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