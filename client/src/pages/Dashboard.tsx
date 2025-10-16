import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import '../styles/Dashboard.css';

interface DashboardStats {
  totalNotes: number;
  totalFlashcards: number;
  totalViews: number;
  totalLikes: number;
  recentNotes: any[];
  moduleBreakdown: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user stats
      const statsResponse = await apiClient.get('/notes/stats/overview');
      setStats(statsResponse.data.overview);
      
      // Fetch recent notes
      const notesResponse = await apiClient.get('/notes?limit=5');
      setRecentNotes(notesResponse.data.notes?.slice(0, 3) || []);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
  <div className="dashboard-page">
        {/* Dynamic Welcome Header */}
        <div className="dashboard-welcome">
          <div className="welcome-content">
            <div className="dynamic-avatar">👋</div>
            <div>
              <h1>Welcome back, {user?.name}!</h1>
              <div className="user-info">
                <span>{user?.usn}</span>
                <span className="dynamic-badge gray">{user?.branch}</span>
                <span className="dynamic-badge gray">Semester {user?.semester}</span>
              </div>
              <p className="welcome-subtitle">Ready to create some amazing notes today? Let's make your VTU studies more efficient! 🚀</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3 className="section-title">📚 Quick Actions</h3>
          <div className="action-cards">
              <Link to="/upload" className="action-card primary-card">
                <div className="action-icon">📤</div>
                <div className="action-content">
                  <h4>Upload PDF</h4>
                  <p>Generate notes, flashcards & summaries from PDFs</p>
                </div>
              </Link>
              <Link to="/notes" className="action-card">
                <div className="action-icon">📝</div>
                <div className="action-content">
                  <h4>My Notes</h4>
                  <p>Browse your organized study materials</p>
                </div>
              </Link>
              <Link to="/student-notes" className="action-card teacher-notes-card">
                <div className="action-icon">📚</div>
                <div className="action-content">
                  <h4>Teacher Notes</h4>
                  <p>Access notes uploaded by your teachers</p>
                </div>
                <div className="new-badge">✨ Featured</div>
              </Link>
              <Link to="/flashcards" className="action-card">
                <div className="action-icon">🎯</div>
                <div className="action-content">
                  <h4>Study Flashcards</h4>
                  <p>Practice with AI-generated flashcards</p>
                </div>
              </Link>
              <Link to="/notes?viewMode=public" className="action-card">
                <div className="action-icon">🌐</div>
                <div className="action-content">
                  <h4>Public Notes</h4>
                  <p>Explore notes shared by other students</p>
                </div>
              </Link>
              <Link to="/available-quizzes" className="action-card">
                <div className="action-icon">🧪</div>
                <div className="action-content">
                  <h4>Teacher Quizzes</h4>
                  <p>Practice quizzes created by your teachers</p>
                </div>
              </Link>
          </div>
        </div>

        {/* Dashboard Stats */}
        {stats && (
          <div className="dashboard-stats">
            <h3 className="section-title">📊 Your Study Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalNotes || 0}</div>
                  <div className="stat-label">Notes Created</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎴</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalFlashcards || 0}</div>
                  <div className="stat-label">Flashcards Generated</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👁️</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalViews || 0}</div>
                  <div className="stat-label">Total Views</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">❤️</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalLikes || 0}</div>
                  <div className="stat-label">Likes Received</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Notes */}
        {recentNotes.length > 0 && (
          <div className="recent-notes">
            <div className="section-header">
              <h3 className="section-title">📚 Recent Notes</h3>
              <Link to="/notes" className="view-all-link">View All →</Link>
            </div>
            <div className="recent-notes-grid">
              {recentNotes.map((note: any) => (
                <div key={note._id} className="recent-note-card">
                  <div className="note-header">
                    <h4 className="dynamic-color-indigo">{note.title}</h4>
                    <div className="note-badges">
                      <span className="dynamic-badge">{note.module}</span>
                      <span className="dynamic-badge purple">{note.subject}</span>
                    </div>
                  </div>
                  <div className="note-meta">
                    <span>📅 {formatDate(note.createdAt)}</span>
                    {note.flashcards?.length > 0 && (
                      <span className="dynamic-badge green">🎯 {note.flashcards.length} cards</span>
                    )}
                  </div>
                  <Link to={`/notes/${note._id}`} className="dynamic-btn" style={{width: 'fit-content'}}>View Note →</Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Getting Started */}
        {(!stats || stats.totalNotes === 0) && (
          <div className="getting-started">
            <h3 className="section-title">🚀 Getting Started</h3>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <h4>Upload Your First PDF</h4>
                <p>Upload lecture notes, textbooks, or study materials in PDF format</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h4>AI Generates Study Materials</h4>
                <p>Our AI creates summaries, flashcards, and key concepts automatically</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h4>Study & Share</h4>
                <p>Practice with flashcards and share your notes with classmates</p>
              </div>
            </div>
            <div className="start-action">
              <Link to="/upload" className="dynamic-btn green" style={{fontWeight: 700, fontSize: '1.1rem'}}>📤 Upload Your First PDF</Link>
            </div>
          </div>
        )}

        {/* VTU Tips */}
        <div className="vtu-tips">
          <h3 className="section-title">💡 VTU Study Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">📖</div>
              <h4>Module-wise Organization</h4>
              <p>Organize your notes by modules for better exam preparation</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🎯</div>
              <h4>Practice Flashcards</h4>
              <p>Regular flashcard practice improves retention by 200%</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🤝</div>
              <h4>Share Knowledge</h4>
              <p>Make your notes public to help fellow students and earn likes</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}