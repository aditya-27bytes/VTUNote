import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacherAuth } from '../contexts/TeacherAuthContext';

const TeacherLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginTeacher } = useTeacherAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }
    
    try {
      await loginTeacher(email, password);
      navigate('/teacher/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center">
      <form className="card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h2>👨‍🏫 Teacher Login</h2>
          <p>Access your teaching dashboard and manage your notes</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

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
        <button type="submit" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>

        <p style={{ marginTop: 8 }}>
          Don't have an account? <button onClick={() => navigate('/teacher/register')} className="link-button">Register as Teacher</button>
        </p>
        <p style={{ marginTop: 8 }}>
          <button onClick={() => navigate('/login')} className="link-button">← Back to Student Login</button>
        </p>

        <div className="demo-credentials">
          <h4>Demo Teacher Account:</h4>
          <p><strong>Email:</strong> teacher@vtu.edu</p>
          <p><strong>Password:</strong> teacher123</p>
        </div>
      </form>
    </div>
  );
};

export default TeacherLoginPage;
