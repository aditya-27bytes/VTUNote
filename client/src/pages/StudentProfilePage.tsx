import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function StudentProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <Layout>
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <span className="avatar-icon">👤</span>
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{user.name}</h1>
              <p className="profile-subtitle">Student Profile</p>
            </div>
          </div>

          <div className="profile-content">
            <div className="info-section">
              <h2 className="section-title">Academic Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{user.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{user.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">USN</span>
                  <span className="info-value">{user.usn}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">College</span>
                  <span className="info-value">{user.college || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Engineering Branch</span>
                  <span className="info-value">{user.branch}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Current Semester</span>
                  <span className="info-value">Semester {user.semester}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Type</span>
                  <span className="info-value">{user.role === 'admin' ? 'Administrator' : 'Student'}</span>
                </div>
                {/* Removed createdAt field since it's not in the User interface */}
              </div>
            </div>

            <div className="stats-section">
              <h2 className="section-title">Activity Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-content">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Notes Uploaded</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎴</div>
                  <div className="stat-content">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Flashcards Created</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🧠</div>
                  <div className="stat-content">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Quizzes Taken</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Teachers Connected</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="actions-section">
              <h2 className="section-title">Account Actions</h2>
              <div className="action-buttons">
                <button className="action-btn primary" onClick={() => navigate("/dashboard")}>
                  📊 Go to Dashboard
                </button>
                <button className="action-btn secondary" onClick={() => navigate("/notes")}>
                  📝 My Notes
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