import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacherAuth } from '../contexts/TeacherAuthContext';

const TeacherProfileEditPage: React.FC = () => {
  const { teacher, updateProfile } = useTeacherAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    designation: '',
    qualification: '',
    experience: '',
    college: '',
    subjects: '',
    bio: '',
    profileImage: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!teacher) {
      navigate('/teacher/login');
      return;
    }
    
    setFormData({
      name: teacher.name || '',
      phone: teacher.phone || '',
      department: teacher.department || '',
      designation: teacher.designation || '',
      qualification: teacher.qualification || '',
      experience: teacher.experience?.toString() || '',
      college: teacher.college || '',
      subjects: teacher.subjects?.join(', ') || '',
      bio: teacher.bio || '',
      profileImage: teacher.profileImage || '',
      password: '',
      confirmPassword: ''
    });
  }, [teacher, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation for password
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        qualification: formData.qualification,
        experience: parseInt(formData.experience),
        college: formData.college,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s),
        bio: formData.bio,
        profileImage: formData.profileImage
      };

      // Only include password if it was provided
      if (formData.password) {
        Object.assign(profileData, { password: formData.password });
      }

      await updateProfile(profileData);
      setSuccess('Profile updated successfully!');
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        navigate('/teacher/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!teacher) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="page">
      <div className="form-container">
        <h1>Edit Profile</h1>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="profile-form">
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
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="designation">Designation</label>
              <select
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="">Select Designation</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Guest Faculty">Guest Faculty</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="qualification">Qualification</label>
              <select
                id="qualification"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="">Select Qualification</option>
                <option value="PhD">PhD</option>
                <option value="M.Tech">M.Tech</option>
                <option value="M.E">M.E</option>
                <option value="M.Sc">M.Sc</option>
                <option value="B.Tech">B.Tech</option>
                <option value="B.E">B.E</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="experience">Experience (years)</label>
              <input
                type="number"
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                required
                min="0"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="college">College/University</label>
              <input
                type="text"
                id="college"
                name="college"
                value={formData.college}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="subjects">Subjects (comma separated)</label>
              <input
                type="text"
                id="subjects"
                name="subjects"
                value={formData.subjects}
                onChange={handleChange}
                placeholder="e.g. Data Structures, Algorithms, Database Systems"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profileImage">Profile Image URL (optional)</label>
            <input
              type="text"
              id="profileImage"
              name="profileImage"
              value={formData.profileImage}
              onChange={handleChange}
              placeholder="https://example.com/your-image.jpg"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio (optional)</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              className="form-textarea"
              rows={4}
            />
          </div>

          <div className="form-divider">
            <h3>Change Password (optional)</h3>
            <p>Leave blank to keep your current password</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/teacher/dashboard')}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherProfileEditPage;