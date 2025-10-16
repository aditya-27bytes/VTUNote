# Deployment Guide: Frontend to Vercel, Backend to Render

This guide will help you deploy your application with the frontend on Vercel and the backend on Render.

## Prerequisites

1. Accounts:
   - [Vercel account](https://vercel.com/signup)
   - [Render account](https://render.com/)
   - MongoDB Atlas account (or another MongoDB hosting service)

2. Tools:
   - Git installed and configured
   - Node.js installed (v16 or higher)

## Step 1: Prepare Your Repository

Make sure your repository is pushed to GitHub:
```bash
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Render

### 2.1. Set up MongoDB

1. If you haven't already, set up a MongoDB database on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string from Atlas dashboard
3. Update the connection string format if needed:
   ```
   mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
   ```

### 2.2. Create Render App

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New+" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `ai-notes-platform-api`
   - Region: Select the closest to your users
   - Branch: `main`
   - Root Directory: `server`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

### 2.3. Set Environment Variables in Render

In the Render dashboard, go to your service > Settings > Environment Variables and add:

```
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_secure_jwt_secret_here
OPENAI_API_KEY=your_openai_api_key_here (optional)
GEMINI_API_KEY=your_gemini_api_key_here (optional)
PERPLEXITY_API_KEY=your_perplexity_api_key_here (optional)
NODE_ENV=production
PORT=10000
```

### 2.4. Deploy

Click "Create Web Service" and wait for deployment to complete.

## Step 3: Deploy Frontend to Vercel

### 3.1. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure the project:
   - Project Name: `ai-notes-platform`
   - Framework Preset: `Vite`
   - Root Directory: `client`
   - Build and Output Settings:
     - Build Command: `npm run build`
     - Output Directory: `dist`

### 3.2. Set Environment Variables in Vercel

In the Vercel dashboard, go to your project > Settings > Environment Variables and add:

```
VITE_API_BASE_URL=https://your-render-app-url.onrender.com/api
```

Replace `your-render-app-url.onrender.com` with the actual URL of your Render deployment.

### 3.3. Deploy

Click "Deploy" and wait for deployment to complete.

## Step 4: Update CORS Settings (If Needed)

After deploying to Render, you may need to update the CORS settings in your server code to allow requests from your Vercel domain.

In [server/src/index.js](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/src/index.js), update the CORS configuration:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app'  // Add your Vercel domain here
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Step 5: Redeploy After Changes

After making any code changes:
1. Commit and push to GitHub
2. Render will automatically redeploy the backend
3. Vercel will automatically redeploy the frontend

## Important Notes

### Environment Variables Security
- Never commit actual .env files to your repository
- All sensitive information should be set through the platform dashboards
- The .env.example files are safe to include as templates

### PDF File Handling
- Uploaded PDFs are stored in the `server/uploads` directory
- On Render, you may need to use external storage (like AWS S3) for persistent file storage
- For now, files will work but may be lost when Render restarts the service

### Performance Considerations
- Render's free tier may have limitations on request processing time
- For production use, consider upgrading to a paid Render plan
- Vercel's free tier is generally sufficient for most frontend needs

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your Vercel domain is added to the CORS whitelist in your server code

2. **Environment Variables Not Loading**: 
   - Check that all required environment variables are set in both platforms
   - Restart the services after updating environment variables

3. **MongoDB Connection Issues**:
   - Verify your MongoDB connection string
   - Check that your MongoDB Atlas cluster allows connections from Render IPs

4. **API Calls Failing**:
   - Check that VITE_API_BASE_URL points to your Render deployment
   - Verify that your Render app is running (check Render dashboard)

### Checking Logs

- **Render**: Go to your service dashboard and click "Logs"
- **Vercel**: Go to your project dashboard and click "Functions" or check deployment logs

## Next Steps

1. Test all functionality after deployment
2. Set up custom domains if needed
3. Consider setting up monitoring and alerting
4. Plan for file storage solution for production use