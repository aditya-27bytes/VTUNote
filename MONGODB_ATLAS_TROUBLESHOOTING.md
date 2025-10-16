# MongoDB Atlas Connection Troubleshooting

This guide addresses common issues when connecting to MongoDB Atlas, particularly the `querySrv EBADNAME` error you're experiencing.

## Understanding the Error

The error `querySrv ENOTFOUND _mongodb._tcp.27` or `querySrv EBADNAME _mongodb._tcp.<cluster-url>` typically occurs when:

1. The cluster URL in your connection string is incorrect or incomplete
2. You're using placeholder values instead of actual values
3. Special characters in your credentials are not properly URL encoded
4. DNS resolution issues with the cluster URL

## How to Fix the Issue

### 1. Get Your Correct Connection String

1. Log in to your MongoDB Atlas account at https://cloud.mongodb.com/
2. Navigate to your cluster
3. Click the "Connect" button
4. Select "Connect your application"
5. Make sure "Node.js" is selected as the driver
6. Copy the full connection string (not just the placeholder)

### 2. Replace ALL Placeholder Values

In your connection string, you must replace ALL of these placeholders:
- `<username>` with your actual database username
- `<password>` with your actual database password
- `<cluster-url>` with your actual cluster URL (e.g., cluster0.abc123.mongodb.net)
- `<database-name>` with your desired database name (e.g., ai_notes)

Example of INCORRECT connection string:
```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

Example of CORRECT connection string:
```
MONGO_URI=mongodb+srv://myUser:myPassword@cluster0.abc123.mongodb.net/ai_notes?retryWrites=true&w=majority
```

### 3. URL Encode Special Characters in Credentials

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

For example, if your password is `aditya@27`, it should be encoded as `aditya%4027`.

### 4. Check Your Cluster Status

1. In MongoDB Atlas, go to your cluster
2. Ensure the cluster status is "Idle" (not "Paused" or "Creating")
3. If paused, click "Resume" to restart it

### 5. Verify Network Access

1. In MongoDB Atlas, go to "Network Access" in the left sidebar
2. Make sure your current IP address is in the access list
3. For development, you can temporarily add `0.0.0.0/0` to allow all IPs (NOT recommended for production)

### 6. Verify Database User

1. In MongoDB Atlas, go to "Database Access" in the left sidebar
2. Make sure the user you're using exists and has proper permissions
3. Ensure the password is correct

## Testing Your Connection

After updating your connection string:

1. Save your [.env](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env) file
2. Restart your server
3. Run the test script: `npm run test-atlas` from the server directory

## Common Mistakes to Avoid

1. Using the example connection string instead of your actual one
2. Not replacing all placeholder values
3. Including angle brackets (`<>`) in the actual values
4. Using your MongoDB Atlas account password instead of the database user password
5. Not URL encoding special characters in credentials
6. Not whitelisting your IP address
7. Using a paused cluster

## Still Having Issues?

If you continue to have connection problems:

1. Double-check that you've copied the connection string from the "Connect your application" option, NOT the "Connect with MongoDB Shell" option
2. Make sure you're using the SRV format (starts with `mongodb+srv://`)
3. Verify that your cluster name in the URL matches exactly what's shown in your Atlas dashboard
4. Try creating a new database user with a simpler password that doesn't contain special characters
5. Contact MongoDB Atlas support if the issue persists