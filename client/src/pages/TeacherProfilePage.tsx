import { useTeacherAuth } from "../contexts/TeacherAuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function TeacherProfilePage() {
  const { teacher, logout } = useTeacherAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!teacher) {
    navigate("/teacher/login");
    return null;
  }

  return (
    <Layout>
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar teacher-avatar">
              <span className="avatar-icon">👨‍🏫</span>
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{teacher.name}</h1>
              <p className="profile-subtitle">Teacher Profile</p>
            </div>
          </div>

          <div className="profile-content">
            <div className="info-section">
              <h2 className="section-title">Professional Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{teacher.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{teacher.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Employee ID</span>
                  <span className="info-value">{teacher.employeeId || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Department</span>
                  <span className="info-value">{teacher.department}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Designation</span>
                  <span className="info-value">{teacher.designation}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Qualification</span>
                  <span className="info-value">{teacher.qualification || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Experience</span>
                  <span className="info-value">{teacher.experience ? `${teacher.experience} years` : 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone Number</span>
                  <span className="info-value">{teacher.phone || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">College/Institution</span>
                  <span className="info-value">{teacher.college || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Subjects</span>
                  <span className="info-value">
                    {teacher.subjects && teacher.subjects.length > 0 
                      ? (Array.isArray(teacher.subjects) 
                          ? teacher.subjects.join(', ') 
                          : teacher.subjects) 
                      : 'Not specified'
                    }
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Member Since</span>
                  <span className="info-value">{new Date(teacher.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
              
              {teacher.bio && (
                <div className="info-section" style={{ marginTop: '24px' }}>
                  <h3 className="section-title">About</h3>
                  <div className="info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="info-value" style={{ lineHeight: '1.6' }}>{teacher.bio}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="stats-section">
              <h2 className="section-title">Teaching Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-content">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Notes Shared</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Quizzes Created</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Students Connected</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Active Classes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="actions-section">
              <h2 className="section-title">Account Actions</h2>
              <div className="action-buttons">
                <button className="action-btn primary" onClick={() => navigate("/teacher/dashboard")}>
                  🏠 Go to Dashboard
                </button>
                <button className="action-btn secondary" onClick={() => navigate("/teacher/quizzes")}>
                  📝 My Quizzes
                </button>
                <button className="action-btn secondary" onClick={() => navigate("/teacher/connections")}>
                  👥 My Students
                </button>
                <button className="action-btn danger" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
