import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacherAuth } from '../contexts/TeacherAuthContext';

const TeacherRegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    department: '',
    designation: '',
    qualification: '',
    experience: '',
    phone: '',
    college: '',
    subjects: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useTeacherAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Additional validation
    if (!formData.employeeId.trim()) {
      setError('Employee ID is required');
      return;
    }

    if (!formData.department.trim()) {
      setError('Department is required');
      return;
    }

    if (!formData.designation.trim()) {
      setError('Designation is required');
      return;
    }

    if (!formData.qualification.trim()) {
      setError('Qualification is required');
      return;
    }

    if (!formData.experience.trim() || isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
      setError('Experience must be a valid number (0 or greater)');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!formData.college.trim()) {
      setError('College name is required');
      return;
    }

    setLoading(true);

    try {
      const teacherData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        employeeId: formData.employeeId.trim(),
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        qualification: formData.qualification.trim(),
        experience: Number(formData.experience),
        phone: formData.phone.trim(),
        college: formData.college.trim(),
        subjects: formData.subjects.trim() ? formData.subjects.split(',').map(s => s.trim()).filter(s => s) : [],
        bio: formData.bio.trim()
      };

      await register(teacherData);
      navigate('/teacher/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center">
      <form className="card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h2>👨‍🏫 Teacher Registration</h2>
          <p>Join our platform to share your knowledge with students</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employeeId">Employee ID *</label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                placeholder="Enter your employee ID"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department *</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                placeholder="e.g., Computer Science"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="designation">Designation *</label>
              <select
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="">Select designation</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Guest Faculty">Guest Faculty</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="qualification">Qualification *</label>
              <input
                type="text"
                id="qualification"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                required
                placeholder="e.g., PhD, M.Tech, M.E."
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="experience">Experience (Years) *</label>
              <input
                type="number"
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                required
                min="0"
                placeholder="Enter years of experience"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{width: '100%'}}>
              <label htmlFor="college">College/Institution *</label>
              <input
                type="text"
                id="college"
                name="college"
                value={formData.college}
                onChange={handleChange}
                required
                placeholder="Enter your college/institution name"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{width: '100%'}}>
              <label htmlFor="subjects">Subjects (comma-separated)</label>
              <input
                type="text"
                id="subjects"
                name="subjects"
                value={formData.subjects}
                onChange={handleChange}
                placeholder="e.g., Data Structures, Algorithms, Database"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{width: '100%'}}>
              <label htmlFor="bio">Bio (Optional)</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                placeholder="Tell us about yourself (max 500 characters)"
                className="form-input"
                style={{resize: 'vertical'}}
              />
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>

        <div className="auth-footer" style={{ marginTop: 8 }}>
          <p>
            Already have an account?{' '}
            <button onClick={() => navigate('/teacher/login')} className="link-button">Sign In</button>
          </p>
          <p>
            <button onClick={() => navigate('/login')} className="link-button">← Back to Student Login</button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default TeacherRegisterPage;
