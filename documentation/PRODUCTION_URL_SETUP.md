# Production URL Setup Guide

This guide explains how to configure the production URLs for connecting your Vercel frontend with your Render backend.

## Step 1: Deploy Your Backend to Render

1. First, deploy your backend to Render using the existing [server/render.yaml](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/render.yaml) configuration
2. After deployment, Render will provide you with a URL for your API service
3. The URL will typically follow this format: `https://your-app-name.onrender.com`

## Step 2: Update Client Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" > "Environment Variables"
4. Add the following environment variable:
   ```
   VITE_API_BASE_URL=https://your-app-name.onrender.com/api
   ```

## Step 3: Update CORS Configuration in Your Backend

After you know your Vercel frontend URL, update the CORS configuration in [server/src/index.js](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/src/index.js):

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app'  // Add your Vercel deployment URL here
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Step 4: Redeploy Both Applications

1. Redeploy your backend to Render to apply the CORS changes
2. Redeploy your frontend to Vercel to apply the environment variable changes

## Example Configuration

### Render Backend URL
After deploying to Render, you'll get a URL like:
```
https://ai-notes-platform-api.onrender.com
```

### Vercel Environment Variable
In Vercel, set:
```
VITE_API_BASE_URL=https://ai-notes-platform-api.onrender.com/api
```

### CORS Configuration
In your server's [index.js](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/src/index.js), update the CORS origin array:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:3000',
    'https://ai-notes-platform.vercel.app'  // Your actual Vercel URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Troubleshooting

### If API Calls Are Failing

1. Check that `VITE_API_BASE_URL` is correctly set in Vercel environment variables
2. Verify that your Render backend URL is correct
3. Ensure CORS is properly configured to allow requests from your Vercel domain
4. Check browser console for CORS errors

### If Environment Variables Aren't Loading

1. Make sure you're using the `VITE_` prefix for all client environment variables
2. Redeploy your Vercel application after adding environment variables
3. Check that there are no typos in the variable names

## Security Notes

- Never commit actual environment files (.env) to your repository
- Use environment variables in deployment platforms instead
- The [.env.example](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env.example) file is safe to include as it contains no real credentials