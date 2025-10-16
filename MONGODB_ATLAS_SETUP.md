# MongoDB Atlas Setup Guide

This guide will help you connect your AI Notes Platform to MongoDB Atlas.

## Step-by-Step Instructions

### 1. Get Your MongoDB Atlas Connection String

1. Log in to your MongoDB Atlas account at https://cloud.mongodb.com/
2. Select your cluster or create a new one
3. Click the "Connect" button on your cluster
4. Select "Connect your application"
5. Choose "Node.js" as the driver and version "4.0 or later"
6. Copy the connection string provided

### 2. Update Your Environment Variables

In your `.env` file, replace the MONGO_URI value with your Atlas connection string:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

Replace the placeholders:
- `<username>`: Your MongoDB Atlas username
- `<password>`: Your MongoDB Atlas password (URL encoded if it contains special characters)
- `<cluster-url>`: Your cluster's URL (e.g., cluster0.xxxxx.mongodb.net)
- `<database-name>`: The name of your database (e.g., ai_notes)

### 3. Configure IP Access List

In MongoDB Atlas:
1. Go to your cluster's "Network Access" section
2. Add your current IP address or allow access from anywhere (0.0.0.0/0) for development

### 4. Database User Setup

In MongoDB Atlas:
1. Go to "Database Access" section
2. Create a database user with read/write permissions
3. Use these credentials in your connection string

### 5. Example Connection String

```
MONGO_URI=mongodb+srv://myUser:myPassword@cluster0.abc123.mongodb.net/ai_notes?retryWrites=true&w=majority
```

### 6. Test the Connection

1. Save your `.env` file
2. Restart your server
3. Check the console logs for "✅ MongoDB connected"

## Troubleshooting

If you encounter connection issues:

1. **Authentication Error**: Double-check your username and password
2. **Network Error**: Verify your IP is in the access list
3. **Cluster Connection Error**: Ensure your cluster is deployed and running
4. **Special Characters in Password**: URL encode special characters in your password

## Security Best Practices

1. Never commit your `.env` file to version control
2. Use strong, unique passwords for your database users
3. Limit IP access to only necessary addresses
4. Regularly rotate your database credentials