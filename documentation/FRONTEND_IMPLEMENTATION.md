# Frontend Implementation Guide - Google OAuth + OTP

## Quick Start

This guide explains how to integrate Google OAuth and OTP verification into the React frontend.

---

## Step 1: Install Google OAuth Package

```bash
cd client
npm install @react-oauth/google
```

---

## Step 2: Configure Google OAuth Provider in App.tsx

Update `src/App.tsx` to wrap your app with Google OAuth provider:

```typescript
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext>
        <TeacherAuthContext>
          <Layout>
            {/* Your routes here */}
          </Layout>
        </TeacherAuthContext>
      </AuthContext>
    </GoogleOAuthProvider>
  );
}

export default App;
```

---

## Step 3: Create .env Variables in Client

Create/update `client/.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000
```

---

## Step 4: Create Google Sign-In Button Component

Create `client/src/components/GoogleSignInButton.tsx`:

```typescript
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useState } from 'react';

interface GoogleSignInButtonProps {
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  buttonText = 'Sign in with Google'
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true);
        onSuccess(codeResponse.access_token);
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      onError?.('Google sign-in failed');
    },
  });

  return (
    <button
      onClick={() => login()}
      disabled={loading}
      className="google-signin-btn"
      style={{
        width: '100%',
        padding: '10px',
        marginTop: '10px',
        backgroundColor: '#4285F4',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: '500'
      }}
    >
      {loading ? 'Signing in...' : buttonText}
    </button>
  );
}
```

---

## Step 5: Create OTP Verification Modal

Create `client/src/components/OTPVerificationModal.tsx`:

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';
import './OTPVerificationModal.css'; // Create this file

interface OTPVerificationModalProps {
  email: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  userType?: 'student' | 'teacher';
  isOpen: boolean;
}

export default function OTPVerificationModal({
  email,
  onVerify,
  onResend,
  userType = 'student',
  isOpen
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [timeLeft, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    try {
      setLoading(true);
      setError('');
      onVerify(otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      onResend();
      setTimeLeft(300);
      setCanResend(false);
      setOtp('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal">
        <h2>Verify Email</h2>
        <p>We sent a 6-digit code to:</p>
        <p className="email-display">{email}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="otp">Enter OTP Code:</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              className="otp-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="timer">
            Code expires in: <span className="time">{minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>

          <button type="submit" disabled={loading || otp.length !== 6} className="verify-btn">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div className="resend-section">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || loading}
            className="resend-btn"
          >
            {canResend ? 'Resend OTP' : `Resend in ${Math.ceil(timeLeft / 60)}m`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Create `client/src/components/OTPVerificationModal.css`:

```css
.otp-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backgroundColor: rgba(0, 0, 0, 0.5);
  display: flex;
  justifyContent: center;
  alignItems: center;
  zIndex: 1000;
}

.otp-modal {
  backgroundColor: white;
  borderRadius: 8px;
  padding: 30px;
  maxWidth: 400px;
  width: 90%;
  boxShadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.otp-modal h2 {
  marginTop: 0;
  color: #333;
  textAlign: center;
}

.otp-modal p {
  color: #666;
  textAlign: center;
  marginBottom: 10px;
}

.email-display {
  fontWeight: 500;
  color: #2196F3;
  fontSize: 14px;
}

.form-group {
  marginBottom: 20px;
}

.form-group label {
  display: block;
  marginBottom: 8px;
  fontWeight: 500;
  color: #333;
}

.otp-input {
  width: 100%;
  padding: 12px;
  fontSize: 24px;
  textAlign: center;
  letterSpacing: 8px;
  border: 2px solid #ddd;
  borderRadius: 4px;
  fontFamily: monospace;
  transition: border-color 0.3s;
}

.otp-input:focus {
  outline: none;
  borderColor: #2196F3;
}

.otp-input:disabled {
  backgroundColor: #f5f5f5;
}

.error-message {
  color: #d32f2f;
  fontSize: 14px;
  marginBottom: 15px;
  padding: 10px;
  backgroundColor: #ffebee;
  borderRadius: 4px;
}

.timer {
  textAlign: center;
  marginBottom: 20px;
  color: #666;
  fontSize: 14px;
}

.timer .time {
  fontWeight: 600;
  color: #2196F3;
  fontFamily: monospace;
}

.verify-btn {
  width: 100%;
  padding: 12px;
  backgroundColor: #2196F3;
  color: white;
  border: none;
  borderRadius: 4px;
  fontSize: 16px;
  fontWeight: 500;
  cursor: pointer;
  transition: backgroundColor 0.3s;
  marginBottom: 10px;
}

.verify-btn:hover:not(:disabled) {
  backgroundColor: #1976D2;
}

.verify-btn:disabled {
  backgroundColor: #ccc;
  cursor: not-allowed;
}

.resend-section {
  textAlign: center;
}

.resend-btn {
  backgroundColor: transparent;
  color: #2196F3;
  border: 1px solid #2196F3;
  padding: 10px 20px;
  borderRadius: 4px;
  cursor: pointer;
  fontSize: 14px;
  fontWeight: 500;
  transition: all 0.3s;
}

.resend-btn:hover:not(:disabled) {
  backgroundColor: #E3F2FD;
}

.resend-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Step 6: Update RegisterPage.tsx

```typescript
import { useState } from 'react';
import axios from 'axios';
import GoogleSignInButton from '../components/GoogleSignInButton';
import OTPVerificationModal from '../components/OTPVerificationModal';

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register-request`, {
        name,
        email,
        usn,
        college,
        branch,
        semester: parseInt(semester)
      });

      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        email,
        otp,
        password,
        name,
        usn,
        college,
        branch,
        semester: parseInt(semester)
      });

      // Save token and redirect
      localStorage.setItem('token', response.data.token);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (token: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google-auth`, {
        token
      });

      if (response.data.googleAuth) {
        // New user - need OTP verification
        setEmail(response.data.email);
        setName(response.data.name);
        setStep('otp');
      } else {
        // Existing user - logged in
        localStorage.setItem('token', response.data.token);
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/resend-otp`, {
        email,
        userType: 'student'
      });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    }
  };

  if (step === 'otp') {
    return (
      <OTPVerificationModal
        email={email}
        isOpen={true}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        userType="student"
      />
    );
  }

  return (
    <div className="register-container">
      <h1>Student Registration</h1>

      <form onSubmit={handleRequestOTP}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="USN (e.g., 1CS21CS001)"
          value={usn}
          onChange={(e) => setUsn(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="College"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          required
        />
        <select value={branch} onChange={(e) => setBranch(e.target.value)} required>
          <option value="">Select Branch</option>
          <option value="CSE">Computer Science</option>
          <option value="ECE">Electronics</option>
          <option value="ME">Mechanical</option>
          <option value="CE">Civil</option>
        </select>
        <input
          type="number"
          placeholder="Semester (1-8)"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          min="1"
          max="8"
          required
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>

      <div className="divider">OR</div>

      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={setError}
        buttonText="Sign up with Google"
      />

      <p>Already have an account? <a href="/login">Login here</a></p>
    </div>
  );
}
```

---

## Step 7: Update LoginPage.tsx

Add Google login option:

```typescript
import { useState } from 'react';
import axios from 'axios';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email,
        password
      });

      localStorage.setItem('token', response.data.token);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (token: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google-auth`, {
        token
      });

      localStorage.setItem('token', response.data.token);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google login failed');
    }
  };

  return (
    <div className="login-container">
      <h1>Student Login</h1>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="divider">OR</div>

      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={setError}
        buttonText="Sign in with Google"
      />

      <p>Don't have an account? <a href="/register">Register here</a></p>
    </div>
  );
}
```

---

## Step 8: Update AuthContext (if needed)

Make sure AuthContext properly handles tokens from both OTP and Google OAuth flows.

---

## Testing Checklist

- [ ] Install @react-oauth/google package
- [ ] Add .env variables
- [ ] Create Google Sign-In button component
- [ ] Create OTP verification modal
- [ ] Update RegisterPage with OTP flow
- [ ] Update LoginPage with Google option
- [ ] Test OTP registration flow
- [ ] Test Google login flow
- [ ] Test OTP resend
- [ ] Test error handling
- [ ] Test token storage and usage

---

## Troubleshooting

### Google Sign-In Not Working
- Verify VITE_GOOGLE_CLIENT_ID in .env.local
- Check browser console for CORS errors
- Verify domain is added to Google Cloud Console

### OTP Not Sending
- Check backend server is running
- Verify Gmail credentials in server .env
- Check network tab in browser devtools

### Token Not Being Used
- Verify token is saved to localStorage
- Check Authorization header is being sent
- Verify JWT in token format

---

## Additional Resources

- Google OAuth React: https://www.npmjs.com/package/@react-oauth/google
- Axios Documentation: https://axios-http.com/
- Backend API Docs: See `GOOGLE_OAUTH_OTP_GUIDE.md`

