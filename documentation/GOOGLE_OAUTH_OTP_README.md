# Google OAuth + OTP Email Verification Feature

## 📋 Overview

This document provides a comprehensive overview of the Google OAuth and OTP email verification feature implemented in the VTUNote platform.

**Feature Status**: ✅ Backend Complete | 🔄 Frontend In Progress

---

## 🎯 What's New?

### For Students
- Register using email + OTP verification
- OR register using Google account with OTP verification
- Login with email/password
- OR login with Google account
- 6-digit OTP sent to registered email
- 5-minute OTP validity
- Resend OTP option
- Max 5 OTP verification attempts

### For Teachers
- Same features as students
- Admin verification required after registration
- Separate authentication endpoints
- Role-specific welcome emails

---

## 📁 Implementation Files

### Backend Files

**Models:**
- `server/src/models/OTP.js` - OTP storage with TTL

**Services:**
- `server/src/services/emailService.js` - Email sending with Nodemailer

**Routes:**
- `server/src/routes/authRoutes.js` - Student auth endpoints
- `server/src/routes/teacherRoutes.js` - Teacher auth endpoints

**Configuration:**
- `server/.env` - Environment variables (Gmail SMTP, Google OAuth)
- `server/.env.example` - Configuration template with instructions
- `server/package.json` - Updated with nodemailer dependency

### Frontend Files (To Create)

**Components:**
- `client/src/components/GoogleSignInButton.tsx` - Google login button
- `client/src/components/OTPVerificationModal.tsx` - OTP entry UI
- `client/src/components/OTPVerificationModal.css` - Styling

**Pages:**
- `client/src/pages/RegisterPage.tsx` - Updated with OTP flow
- `client/src/pages/LoginPage.tsx` - Updated with Google login
- Teacher registration page - New with OTP flow

**Configuration:**
- `client/.env.local` - Google Client ID
- `client/src/App.tsx` - Wrapped with GoogleOAuthProvider

### Documentation Files

- `GOOGLE_OAUTH_OTP_GUIDE.md` - Complete API and setup guide
- `IMPLEMENTATION_SUMMARY.md` - Summary of changes
- `FRONTEND_IMPLEMENTATION.md` - Step-by-step frontend guide

---

## 🔄 Registration Flow

### OTP-Based Registration Flow

```
User Registration Form
        ↓
    Validate Input
        ↓
  Check Duplicates
        ↓
  Generate OTP
        ↓
Save OTP to DB (5-min TTL)
        ↓
Send OTP via Email
        ↓
User Receives Email
        ↓
User Enters OTP
        ↓
Verify OTP
        ↓
Create User Account
        ↓
Send Welcome Email
        ↓
Delete OTP Record
        ↓
Generate JWT Token
        ↓
Login & Redirect
```

### Google OAuth Registration Flow

```
Click "Sign in with Google"
        ↓
Google Consent Screen
        ↓
Get Access Token
        ↓
Verify Token with Google API
        ↓
User Exists?
    YES → Generate JWT → Login
    NO → Continue
        ↓
Generate OTP
        ↓
Send OTP to Email
        ↓
User Enters OTP + Details
        ↓
Verify OTP
        ↓
Create User Account
        ↓
Send Welcome Email
        ↓
Generate JWT Token
        ↓
Login & Redirect
```

---

## 🚀 Quick Start

### Backend Setup

1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Configure Gmail SMTP**:
   - Enable 2FA on Gmail: https://myaccount.google.com/security
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Update `.env`:
     ```env
     GMAIL_USER=your_gmail@gmail.com
     GMAIL_APP_PASSWORD=your_16_char_password
     ```

3. **Configure Google OAuth**:
   - Create project: https://console.cloud.google.com/
   - Create OAuth credentials (Web application)
   - Add redirect URIs:
     - `http://localhost:5000/auth/google/callback`
     - `http://localhost:5000/teachers/google/callback`
   - Update `.env`:
     ```env
     GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your_client_secret
     ```

4. **Start Server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Google OAuth Package**:
   ```bash
   cd client
   npm install @react-oauth/google
   ```

2. **Create `.env.local`**:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   VITE_API_URL=http://localhost:5000
   ```

3. **Wrap App with GoogleOAuthProvider** in `src/App.tsx`

4. **Create Components** (See `FRONTEND_IMPLEMENTATION.md`)

5. **Update Pages** (RegisterPage, LoginPage)

6. **Start Client**:
   ```bash
   npm run dev
   ```

---

## 🔐 Security Features

| Feature | Implementation | Status |
|---------|-----------------|--------|
| OTP Expiration | 5-minute TTL | ✅ Active |
| Attempt Limiting | Max 5 attempts | ✅ Active |
| Password Hashing | Bcrypt with salt | ✅ Active |
| JWT Tokens | 7-day expiration | ✅ Active |
| Email Verification | Required for signup | ✅ Active |
| Google Token Verification | Against Google API | ✅ Active |
| Environment Secrets | In .env (not committed) | ✅ Active |
| Rate Limiting | Ready to implement | 🔄 Pending |
| HTTPS Only | For production | 🔄 Pending |

---

## 📡 API Endpoints

### Student Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register-request` | Request OTP for registration |
| POST | `/api/auth/verify-otp` | Verify OTP and complete registration |
| POST | `/api/auth/resend-otp` | Resend OTP if expired |
| POST | `/api/auth/google-auth` | Authenticate with Google token |
| POST | `/api/auth/complete-google-registration` | Complete Google registration with OTP |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Legacy registration (backward compatible) |
| GET | `/api/auth/me` | Get current user info |

### Teacher Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/teachers/register-request` | Request OTP for registration |
| POST | `/api/teachers/verify-otp` | Verify OTP and complete registration |
| POST | `/api/teachers/resend-otp` | Resend OTP if expired |
| POST | `/api/teachers/google-auth` | Authenticate with Google token |
| POST | `/api/teachers/complete-google-registration` | Complete Google registration with OTP |
| POST | `/api/teachers/login` | Login with email/password |
| POST | `/api/teachers/register` | Legacy registration (backward compatible) |

---

## 📚 Documentation

### Complete Guides

1. **Backend API Documentation**
   - File: `GOOGLE_OAUTH_OTP_GUIDE.md`
   - Includes: Setup, endpoints, error handling, testing

2. **Implementation Summary**
   - File: `IMPLEMENTATION_SUMMARY.md`
   - Includes: What was built, changes made, next steps

3. **Frontend Implementation**
   - File: `FRONTEND_IMPLEMENTATION.md`
   - Includes: Step-by-step component creation, integration

4. **Environment Configuration**
   - File: `server/.env.example`
   - Includes: Setup instructions, all required variables

---

## ✅ Testing

### Backend Testing

```bash
# Test OTP Request
curl -X POST http://localhost:5000/api/auth/register-request \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "usn": "1CS21CS001",
    "college": "VTU College",
    "branch": "CSE",
    "semester": 5
  }'

# Test OTP Verification
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456",
    "password": "SecurePassword123",
    "name": "John Doe",
    "usn": "1CS21CS001",
    "college": "VTU College",
    "branch": "CSE",
    "semester": 5
  }'
```

### Frontend Testing

1. Test OTP registration flow
2. Test Google login flow
3. Test OTP resend
4. Test error handling
5. Test token persistence
6. Test authenticated API calls

---

## 📊 Database Schema

### OTP Collection

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "otp": "123456",
  "userType": "student",
  "isVerified": false,
  "attempts": 0,
  "createdAt": "2024-01-15T10:30:00Z",
  "expiresAt": "2024-01-15T10:35:00Z"
}
```

**TTL Index**: Automatically deletes after 300 seconds (5 minutes)

### User Collection (Updated)

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2b$10$...", // bcrypt hash
  "usn": "1CS21CS001",
  "college": "VTU College",
  "branch": "CSE",
  "semester": 5,
  "role": "student",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Teacher Collection (Updated)

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "name": "Dr. Jane Smith",
  "email": "jane@university.edu",
  "password": "$2b$10$...", // bcrypt hash
  "employeeId": "EMP12345",
  "department": "Computer Science",
  "designation": "Associate Professor",
  "qualification": "Ph.D.",
  "experience": 8,
  "phone": "9876543210",
  "college": "VTU College",
  "subjects": ["Data Structures", "Algorithms"],
  "role": "teacher",
  "isVerified": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## 🔧 Configuration

### Required Environment Variables

**Gmail SMTP**
```env
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx
```

**Google OAuth**
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

**Server**
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

**Client**
```env
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000
```

---

## 🐛 Troubleshooting

### Problem: "Failed to send OTP"
**Solution**:
- Verify Gmail 2FA is enabled
- Check App Password is correct
- Ensure GMAIL_USER and GMAIL_APP_PASSWORD in .env
- Try generating new App Password

### Problem: "Failed to authenticate with Google"
**Solution**:
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Check token hasn't expired
- Verify redirect URIs in Google Cloud Console
- Ensure Google+ API is enabled

### Problem: "OTP expired"
**Solution**:
- OTP valid for 5 minutes only
- Click "Resend OTP" to get new code

### Problem: "Too many failed attempts"
**Solution**:
- Maximum 5 verification attempts
- Click "Resend OTP" to get new code

---

## 📈 Performance Considerations

- **OTP Generation**: < 1ms
- **Email Sending**: 1-3 seconds via Gmail SMTP
- **Google Token Verification**: 200-500ms
- **Database Queries**: < 10ms (with indexes)
- **JWT Generation**: < 1ms

**Optimization Tips**:
- Cache Google token verification results (short TTL)
- Use connection pooling for database
- Consider queuing email sending for high volume
- Implement rate limiting on auth endpoints

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Enable HTTPS/SSL certificates
- [ ] Update Google OAuth redirect URIs to production domain
- [ ] Switch from Gmail to enterprise email service (SendGrid, AWS SES)
- [ ] Set strong JWT_SECRET
- [ ] Enable rate limiting on auth endpoints
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for production domain
- [ ] Set secure cookie flags for JWT
- [ ] Enable CSRF protection
- [ ] Add monitoring and alerting
- [ ] Set up email delivery verification
- [ ] Test complete registration flow

### Production Environment Variables

```env
# Database
MONGO_URI=mongodb+srv://prod_user:prod_pass@prod-cluster.mongodb.net/prod_db

# Security
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production

# Email (use SendGrid or similar)
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Google OAuth (update redirect URIs)
GOOGLE_CLIENT_ID=prod_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod_client_secret

# Server
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

---

## 📞 Support & Maintenance

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| OTP not received | Check spam folder, verify email config, resend OTP |
| Google login fails | Verify credentials, check redirect URI, refresh token |
| Registration hangs | Check API server running, verify network connection |
| Token invalid error | Clear localStorage, login again, check JWT_SECRET |

### Monitoring

- Monitor OTP success/failure rates
- Track email delivery status
- Monitor Google API quota usage
- Track authentication endpoint performance
- Alert on high failed attempt rates

---

## 📝 Next Steps

1. **Frontend Implementation** (See `FRONTEND_IMPLEMENTATION.md`)
   - Create components
   - Update pages
   - Test flows

2. **Testing & QA**
   - Manual testing of all flows
   - Error scenario testing
   - Performance testing
   - Security testing

3. **Optimization**
   - Email queue system
   - Rate limiting
   - Caching strategy
   - Performance monitoring

4. **Production Deployment**
   - SSL certificates
   - Domain setup
   - Email service migration
   - Monitoring setup

---

## 📚 References

- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2
- Nodemailer Documentation: https://nodemailer.com/
- MongoDB TTL Documentation: https://docs.mongodb.com/manual/core/ttl/
- JWT Documentation: https://jwt.io/
- Bcrypt Documentation: https://github.com/kelektiv/node.bcrypt.js

---

## 📄 License

This feature is part of the VTUNote platform. All rights reserved.

---

**Last Updated**: January 2024
**Status**: ✅ Backend Complete | 🔄 Frontend In Progress
**Next Review**: February 2024

