# Google OAuth + OTP Email Verification Authentication Guide

## Overview
This guide explains the new Google OAuth authentication with OTP email verification for both students and teachers in the VTUNote platform.

## Features Implemented

### 1. OTP-Based Registration Flow
- Request OTP endpoint: Sends OTP to email
- Verify OTP endpoint: Validates OTP and completes registration
- Resend OTP endpoint: Requests a new OTP if expired

### 2. Google OAuth Integration
- Google token verification using Google API
- Automatic user creation on first login
- OTP verification for new users during Google registration

### 3. Email Service
- Nodemailer integration with Gmail SMTP
- HTML-formatted OTP emails
- Role-specific welcome emails
- 5-minute OTP expiration with TTL index

---

## Setup Instructions

### Step 1: Gmail SMTP Configuration

1. **Enable 2-Factor Authentication** on your Google Account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Visit https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password (without spaces)

3. **Update Server .env**:
   ```env
   GMAIL_USER=your_gmail@gmail.com
   GMAIL_APP_PASSWORD=xxxxxxxxxxxx
   ```

### Step 2: Google OAuth 2.0 Setup

1. **Create Google Cloud Project**:
   - Go to https://console.cloud.google.com/
   - Create a new project

2. **Enable Google+ API**:
   - Search for "Google+ API" in the search bar
   - Enable it for your project

3. **Create OAuth 2.0 Credentials**:
   - Go to "Credentials" in the left sidebar
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application"
   - Name it (e.g., "VTUNote Web Client")

4. **Configure Authorized Origins and URIs**:
   
   **Authorized JavaScript Origins:**
   ```
   http://localhost:3000        (development)
   https://yourdomain.com       (production)
   ```

   **Authorized Redirect URIs:**
   ```
   http://localhost:5000/auth/google/callback        (development)
   https://yourdomain.com/auth/google/callback       (production)
   ```

5. **Copy Credentials to .env**:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

---

## API Endpoints

### Student Registration

#### 1. Request OTP for Registration
```http
POST /api/auth/register-request
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "usn": "1CS21CS001",
  "college": "VTU College",
  "branch": "CSE",
  "semester": 5
}
```

**Response (200)**:
```json
{
  "message": "✅ OTP sent to your email. Please verify within 5 minutes.",
  "email": "john@example.com",
  "registrationData": { ... }
}
```

#### 2. Verify OTP and Complete Registration
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456",
  "password": "SecurePassword123",
  "name": "John Doe",
  "usn": "1CS21CS001",
  "college": "VTU College",
  "branch": "CSE",
  "semester": 5
}
```

**Response (200)**:
```json
{
  "message": "✅ Registration successful! Email verified.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "usn": "1CS21CS001",
    "college": "VTU College",
    "branch": "CSE",
    "semester": 5,
    "role": "student"
  }
}
```

#### 3. Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "userType": "student"
}
```

---

### Google Authentication (Students)

#### 1. Google Login/Register
```http
POST /api/auth/google-auth
Content-Type: application/json

{
  "token": "Google_Access_Token_Here"
}
```

**Response for Existing User (200)**:
```json
{
  "message": "✅ Login successful",
  "token": "JWT_Token_Here",
  "user": { ... }
}
```

**Response for New User (200)** - Requires OTP verification:
```json
{
  "message": "✅ Google authentication successful. Please verify OTP to complete registration.",
  "email": "john@gmail.com",
  "name": "John Doe",
  "picture": "https://...",
  "googleAuth": true
}
```

#### 2. Complete Google Registration with OTP
```http
POST /api/auth/complete-google-registration
Content-Type: application/json

{
  "email": "john@gmail.com",
  "otp": "123456",
  "name": "John Doe",
  "usn": "1CS21CS001",
  "college": "VTU College",
  "branch": "CSE",
  "semester": 5
}
```

**Response (200)**:
```json
{
  "message": "✅ Registration completed successfully",
  "token": "JWT_Token_Here",
  "user": { ... }
}
```

---

### Teacher Registration

#### 1. Request OTP for Teacher Registration
```http
POST /api/teachers/register-request
Content-Type: application/json

{
  "name": "Dr. Jane Smith",
  "email": "jane@university.edu",
  "employeeId": "EMP12345",
  "department": "Computer Science",
  "designation": "Associate Professor",
  "qualification": "Ph.D.",
  "experience": 8,
  "phone": "9876543210",
  "college": "VTU College",
  "subjects": ["Data Structures", "Algorithms"]
}
```

**Response (200)**:
```json
{
  "message": "✅ OTP sent to your email. Please verify within 5 minutes.",
  "email": "jane@university.edu",
  "registrationData": { ... }
}
```

#### 2. Verify OTP and Complete Teacher Registration
```http
POST /api/teachers/verify-otp
Content-Type: application/json

{
  "email": "jane@university.edu",
  "otp": "123456",
  "password": "SecurePassword123",
  "name": "Dr. Jane Smith",
  "employeeId": "EMP12345",
  "department": "Computer Science",
  "designation": "Associate Professor",
  "qualification": "Ph.D.",
  "experience": 8,
  "phone": "9876543210",
  "college": "VTU College",
  "subjects": ["Data Structures", "Algorithms"]
}
```

**Response (200)**:
```json
{
  "message": "✅ Registration successful! Email verified. Awaiting admin verification.",
  "token": "JWT_Token_Here",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Dr. Jane Smith",
    "email": "jane@university.edu",
    "employeeId": "EMP12345",
    "department": "Computer Science",
    "designation": "Associate Professor",
    "college": "VTU College",
    "role": "teacher",
    "isVerified": false
  }
}
```

#### 3. Google Authentication for Teachers
```http
POST /api/teachers/google-auth
Content-Type: application/json

{
  "token": "Google_Access_Token_Here"
}
```

#### 4. Complete Google Registration for Teachers
```http
POST /api/teachers/complete-google-registration
Content-Type: application/json

{
  "email": "jane@gmail.com",
  "otp": "123456",
  "name": "Dr. Jane Smith",
  "employeeId": "EMP12345",
  "department": "Computer Science",
  "designation": "Associate Professor",
  "qualification": "Ph.D.",
  "experience": 8,
  "phone": "9876543210",
  "college": "VTU College",
  "subjects": ["Data Structures", "Algorithms"]
}
```

---

## Database Models

### OTP Model
```javascript
{
  _id: ObjectId,
  email: String,
  otp: String (6-digit code),
  userType: 'student' | 'teacher',
  isVerified: Boolean,
  attempts: Number (max 5),
  createdAt: Date (auto-expires after 300 seconds),
  expiresAt: Date
}
```

**TTL Index**: Automatically deletes OTP records 5 minutes after creation

### User Model (Updated)
```javascript
{
  // existing fields...
  email: String (unique),
  password: String (hashed with bcrypt),
  name: String,
  usn: String (unique),
  college: String,
  branch: String,
  semester: Number,
  role: String (default: 'student'),
  createdAt: Date,
  updatedAt: Date
}
```

### Teacher Model (Updated)
```javascript
{
  // existing fields...
  email: String (unique),
  password: String (hashed with bcrypt),
  name: String,
  employeeId: String (unique),
  department: String,
  designation: String,
  qualification: String,
  experience: Number,
  phone: String,
  college: String,
  subjects: Array,
  role: String (default: 'teacher'),
  isVerified: Boolean (requires admin verification),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Email Templates

### OTP Email Template
```html
Dear [User Name],

Your One-Time Password (OTP) for email verification is:

[6-DIGIT OTP]

This code is valid for 5 minutes only. Do not share this code with anyone.

If you did not request this code, please ignore this email.

Best regards,
VTUNote Team

⚠️ Security Notice: We will never ask you to share your OTP via email or phone.
```

### Welcome Email Template
```html
Dear [User Name],

Welcome to VTUNote! Your email has been successfully verified.

[Role-Specific Content]

For Students:
- Access comprehensive study notes
- Create and share flashcards
- Take quizzes to test your knowledge
- Connect with peers

For Teachers:
- Upload and manage course materials
- Create interactive quizzes
- Track student performance
- Manage digital notes

Get started now by logging in to your account.

Best regards,
VTUNote Team
```

---

## Error Handling

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 400 | "All fields are required" | Ensure all required fields are provided |
| 400 | "Invalid email format" | Check email format (e.g., user@example.com) |
| 400 | "Invalid USN format" | USN must match VTU format (e.g., 1CS21CS001) |
| 400 | "User with this email already exists" | Use a different email or login |
| 400 | "OTP expired or not found" | Request a new OTP |
| 400 | "Invalid OTP" | Check OTP and try again (5 attempts max) |
| 400 | "Too many failed attempts" | Request a new OTP |
| 500 | "Failed to send OTP" | Check Gmail configuration in .env |
| 500 | "Failed to authenticate with Google" | Verify Google token and API setup |

---

## Frontend Integration (React)

### Example: OTP Registration Flow

```typescript
// 1. Request OTP
const requestOTP = async (email: string) => {
  const response = await axios.post('/api/auth/register-request', {
    name,
    email,
    usn,
    college,
    branch,
    semester
  });
  setEmail(response.data.email);
  setShowOTPInput(true);
};

// 2. Verify OTP
const verifyOTP = async (otp: string) => {
  const response = await axios.post('/api/auth/verify-otp', {
    email,
    otp,
    password,
    name,
    usn,
    college,
    branch,
    semester
  });
  localStorage.setItem('token', response.data.token);
  // Redirect to dashboard
};

// 3. Resend OTP
const resendOTP = async () => {
  await axios.post('/api/auth/resend-otp', { email });
};
```

---

## Security Considerations

1. **OTP Expiration**: OTPs expire after 5 minutes
2. **Attempt Limiting**: Maximum 5 failed verification attempts
3. **Password Hashing**: All passwords hashed with bcrypt
4. **JWT Tokens**: Tokens valid for 7 days
5. **HTTPS Only**: Always use HTTPS in production
6. **Environment Variables**: Never commit .env files
7. **Email Privacy**: Never log or display full email addresses in responses
8. **Rate Limiting**: Consider implementing rate limiting on OTP endpoints

---

## Troubleshooting

### Gmail SMTP Not Working

**Problem**: "Failed to send OTP" error

**Solution**:
1. Verify 2FA is enabled on Gmail account
2. Check App Password is correct (remove any spaces)
3. Ensure GMAIL_USER and GMAIL_APP_PASSWORD are set in .env
4. Try generating a new App Password
5. Check firewall/antivirus isn't blocking SMTP port 587

### Google OAuth Token Invalid

**Problem**: "Failed to authenticate with Google" error

**Solution**:
1. Verify Google Client ID and Secret are correct
2. Check Google token hasn't expired
3. Ensure redirect URIs match exactly in Google Console
4. Verify Google+ API is enabled

### OTP Not Being Received

**Problem**: User doesn't receive OTP email

**Solution**:
1. Check user hasn't exceeded 5 resend attempts
2. Verify email address is correct
3. Check spam/junk folder
4. Verify Gmail credentials in .env
5. Check MongoDB connection for OTP storage

---

## Testing

### Using Postman/Thunder Client

1. **Test OTP Registration**:
   - POST to `http://localhost:5000/api/auth/register-request`
   - Include all required fields
   - Check email for OTP
   - POST to `http://localhost:5000/api/auth/verify-otp` with OTP

2. **Test Google OAuth**:
   - Get Google token from frontend
   - POST to `http://localhost:5000/api/auth/google-auth`
   - For new users, complete registration with OTP

---

## Deployment Notes

1. Update Google Console redirect URIs to production URLs
2. Set `NODE_ENV=production` in .env
3. Generate strong JWT_SECRET (use `openssl rand -base64 32`)
4. Use production email service (e.g., SendGrid instead of Gmail for scale)
5. Enable rate limiting on auth endpoints
6. Set up HTTPS/SSL certificates
7. Configure CORS for production domain

---

## Support & Documentation

For more information:
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Nodemailer: https://nodemailer.com/
- MongoDB TTL Indexes: https://docs.mongodb.com/manual/core/ttl/
- JWT: https://jwt.io/

