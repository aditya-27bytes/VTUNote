# Git Ignore Guide

This document explains the purpose of the .gitignore files in this project and what they exclude from version control.

## Project Structure

The project has three .gitignore files:
1. Root [.gitignore](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/.gitignore) - Covers the entire project
2. [client/.gitignore](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/client/.gitignore) - Covers the client-side application
3. [server/.gitignore](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.gitignore) - Covers the server-side application

## What's Ignored

### Dependencies
- `node_modules/` - All npm packages that can be reinstalled with `npm install`
- Dependency lock files that may vary between environments

### Environment Files
- `.env` - Contains sensitive configuration like API keys and database credentials
- `.env.local`, `.env.production.local` - Local environment overrides
- `.env.test` - Test environment configuration

### Build Artifacts
- `dist/` - Production builds
- `dist-ssr/` - Server-side rendered builds
- `build/` - Compiled output
- `coverage/` - Test coverage reports

### Logs and Runtime Data
- `logs/` - Application log files
- `*.log` - Log files
- `pids/` - Process ID files
- `*.pid` - Process ID files

### IDE and Editor Files
- `.vscode/` - VS Code settings (except extensions.json)
- `.idea/` - IntelliJ/WebStorm settings
- `*.suo`, `*.ntvs*`, `*.njsproj`, `*.sln` - Visual Studio files
- `*.iml`, `*.ipr`, `*.iws` - IntelliJ IDEA files

### OS Generated Files
- `.DS_Store` - macOS folder metadata
- `Thumbs.db` - Windows thumbnail cache

### Uploaded Content
- `uploads/` - User uploaded files (in both client and server)
- `server/uploads/` - Server-side uploaded files
- `client/public/uploads/` - Client-side public uploads

### Temporary and Cache Files
- `*.tmp`, `*.temp` - Temporary files
- `.eslintcache` - ESLint cache
- `.npm` - npm cache directory
- `.node_repl_history` - Node.js REPL history

## Deployment Considerations

When deploying this application, make sure to:

1. Set up environment variables on the deployment platform instead of including .env files
2. Run `npm install` or `yarn install` to install dependencies
3. Build the client application with `npm run build` or equivalent
4. Ensure the server has proper access to any required services (database, file storage, etc.)

## Security Notes

Never commit sensitive information like:
- API keys
- Database passwords
- Private keys
- Secret tokens

Instead, use environment variables and add the relevant files to .gitignore.

## Customization

Feel free to modify these .gitignore files based on your specific development environment or additional tools you may be using. Just ensure that sensitive information and unnecessary files remain excluded from version control.