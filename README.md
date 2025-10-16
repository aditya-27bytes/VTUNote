# AI Notes Platform

A comprehensive platform for managing and sharing educational notes with AI-powered features.

## Repository Status

This repository has been reset and cleaned for easier working and deployment. It now has:

- Proper [.gitignore](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/.gitignore) configuration at all levels
- Clean commit history
- No sensitive information
- Proper documentation for deployment

## Deployment

This application is designed to be deployed with:
- **Frontend** on [Vercel](https://vercel.com/)
- **Backend** on [Render](https://render.com/)

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/DEPLOYMENT_GUIDE.md)

### Quick Deployment Steps

1. Push this repository to GitHub
2. Deploy the `server` directory to Render
3. Deploy the `client` directory to Vercel
4. Set up environment variables on both platforms
5. Update the client's API URL to point to your Render deployment

## Development

### Client Setup
```bash
cd client
npm install
npm run dev
```

### Server Setup
```bash
cd server
npm install
npm start
```

## Environment Variables

Set up your environment variables in both client and server directories using the provided [.env.example](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env.example) files.

## Documentation

- [DEPLOYMENT_GUIDE.md](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/DEPLOYMENT_GUIDE.md) - Complete deployment instructions for Vercel and Render
- [GITHUB_DEPLOYMENT_GUIDE.md](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/GITHUB_DEPLOYMENT_GUIDE.md) - Instructions for deploying to GitHub
- [REPOSITORY_RESET_SUMMARY.md](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/REPOSITORY_RESET_SUMMARY.md) - Summary of the repository reset process
- [GIT_IGNORE_GUIDE.md](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/GIT_IGNORE_GUIDE.md) - Explanation of git ignore patterns used
- [ENV_FILES_SECURITY_CHECK.md](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/ENV_FILES_SECURITY_CHECK.md) - Verification that environment files are properly secured