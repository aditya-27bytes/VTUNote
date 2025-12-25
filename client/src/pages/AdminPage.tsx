import { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";
import Layout from "../components/Layout";
import {
  DailyActivityChart,
  UsersByBranchChart,
  UsersBySemesterChart,
  NotesBySubjectChart,
  PlatformOverviewChart,
  MostViewedNotesChart
} from "../components/AdminCharts";

type U = { _id: string; name: string; email: string; role: "user" | "admin"; createdAt?: string };

type Note = {
  _id: string;
  title: string;
  subject: string;
  module: string;
  semester: number;
  branch: string;
  views: number;
  isPublic: boolean;
  createdAt: string;
  user?: { name: string; email: string };
};

type DashboardStats = {
  users: {
    total: number;
    admins: number;
    recent: number;
    byBranch: Array<{ _id: string; count: number }>;
    bySemester: Array<{ _id: number; count: number }>;
    byCollege: Array<{ _id: string; count: number }>;
  };
  notes: {
    total: number;
    public: number;
    private: number;
    recent: number;
    bySubject: Array<{ _id: string; count: number }>;
    byModule: Array<{ _id: string; count: number }>;
    bySemester: Array<{ _id: number; count: number }>;
    mostViewed: Note[];
  };
  activity: {
    daily: Array<{ date: string; users: number; notes: number }>;
  };
};

export default function AdminPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [publicNotes, setPublicNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'notes' | 'public-notes'>('dashboard');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  const loadStats = async () => {
    try {
      const r = await apiClient.get(`/admin/dashboard-stats?range=${dateRange}`);
      setStats(r.data);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    }
  };

  const loadNotes = async () => {
    try {
      const r = await apiClient.get("/admin/notes");
      setNotes(r.data.notes || []);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  const loadPublicNotes = async () => {
    try {
      const r = await apiClient.get("/admin/public-notes");
      setPublicNotes(r.data.notes || []);
    } catch (error) {
      console.error("Failed to load public notes:", error);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        (async () => {
          const r = await apiClient.get("/admin/users");
          setUsers(r.data);
        })(),
        loadNotes(),
        loadPublicNotes()
      ]);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, dateRange]);

  useEffect(() => {
    load();
  }, [dateRange]);

  const promote = async (id: string) => {
    try {
      await apiClient.patch(`/admin/users/${id}/role`, { role: "admin" });
      await load();
    } catch (error) {
      console.error("Failed to promote user:", error);
    }
  };

  const demote = async (id: string) => {
    try {
      await apiClient.patch(`/admin/users/${id}/role`, { role: "user" });
      await load();
    } catch (error) {
      console.error("Failed to demote user:", error);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      await load();
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await apiClient.delete(`/admin/notes/${id}`);
      await load();
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const toggleNoteVisibility = async (id: string) => {
    try {
      await apiClient.patch(`/admin/notes/${id}/visibility`);
      await load();
    } catch (error) {
      console.error("Failed to toggle note visibility:", error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="teacher-dashboard-page admin-page">
        {/* Header Card */}
        <div className="dashboard-header-card">
          <div className="dashboard-header-content">
            <div className="dashboard-header-left">
              <div className="dashboard-header-avatar">
                <span className="avatar-icon">👨‍💼</span>
              </div>
              <div className="dashboard-header-info">
                <h1 className="dashboard-title">Admin Dashboard</h1>
                <h3 className="dashboard-name">Platform Administrator</h3>
                <div className="dashboard-meta">
                  <span>System Management • Platform Oversight</span>
                  <span>VTU NOTE</span>
                </div>
              </div>
            </div>
            <div className="dashboard-header-right">
              <button onClick={() => window.location.reload()} className="dashboard-logout-btn">
                🔄 Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="dashboard-tabs-row">
          <button
            className={`dashboard-tab-btn${activeTab === 'dashboard' ? ' active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >📊 Dashboard</button>
          <button
            className={`dashboard-tab-btn${activeTab === 'users' ? ' active' : ''}`}
            onClick={() => setActiveTab('users')}
          >👥 Users</button>
          <button
            className={`dashboard-tab-btn${activeTab === 'notes' ? ' active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >📝 All Notes</button>
          <button
            className={`dashboard-tab-btn${activeTab === 'public-notes' ? ' active' : ''}`}
            onClick={() => setActiveTab('public-notes')}
          >🌐 Public Notes</button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="dashboard-stats-grid">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">👥</div>
              <div className="dashboard-stat-info">
                <div className="dashboard-stat-number">{stats.users.total}</div>
                <div className="dashboard-stat-label">Total Users</div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">👑</div>
              <div className="dashboard-stat-info">
                <div className="dashboard-stat-number">{stats.users.admins}</div>
                <div className="dashboard-stat-label">Admin Users</div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">📝</div>
              <div className="dashboard-stat-info">
                <div className="dashboard-stat-number">{stats.notes.total}</div>
                <div className="dashboard-stat-label">Total Notes</div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">🌐</div>
              <div className="dashboard-stat-info">
                <div className="dashboard-stat-number">{stats.notes.public}</div>
                <div className="dashboard-stat-label">Public Notes</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="dashboard-tab-content">
          {activeTab === "dashboard" && stats && (
            <div className="dashboard-overview-section">
              {/* Controls */}
              <div className="dashboard-overview-card" style={{ marginBottom: '24px' }}>
                <h3>⚙️ Dashboard Controls</h3>
                <div className="dashboard-controls-container">
                  <div className="dashboard-control-group">
                    <label className="dashboard-control-label">📅 Date Range:</label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value as any)}
                      className="dashboard-control-select"
                    >
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                      <option value="1y">Last Year</option>
                    </select>
                  </div>

                  <div className="dashboard-control-group">
                    <label className="dashboard-control-checkbox">
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={() => setAutoRefresh(!autoRefresh)}
                      />
                      🔄 Auto Refresh
                    </label>

                    {autoRefresh && (
                      <select
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        className="dashboard-control-select"
                      >
                        <option value={15000}>15s</option>
                        <option value={30000}>30s</option>
                        <option value={60000}>1m</option>
                        <option value={300000}>5m</option>
                      </select>
                    )}
                  </div>

                  <button
                    onClick={loadStats}
                    className="dashboard-refresh-btn"
                    title="Refresh Dashboard Data"
                  >
                    🔄
                  </button>
                </div>
              </div>

              {/* Charts */}
              <div className="dashboard-overview-grid">
                <div className="dashboard-overview-card">
                  <h3>📊 Platform Overview</h3>
                  <PlatformOverviewChart
                    totalUsers={stats.users.total}
                    totalNotes={stats.notes.total}
                    publicNotes={stats.notes.public}
                    privateNotes={stats.notes.private}
                    recentUsers={stats.users.recent}
                    recentNotes={stats.notes.recent}
                    onRefresh={loadStats}
                  />
                </div>

                <div className="dashboard-overview-card">
                  <h3>📈 Daily Activity</h3>
                  <DailyActivityChart data={stats.activity.daily} onRefresh={loadStats} />
                </div>

                <div className="dashboard-overview-card">
                  <h3>📊 Most Viewed Notes</h3>
                  <div className="dashboard-notes-grid" style={{ gridTemplateColumns: '1fr', gap: '12px' }}>
                    {stats.notes.mostViewed.slice(0, 5).map(note => (
                      <div key={note._id} className="dashboard-note-card" style={{ padding: '16px' }}>
                        <div className="dashboard-note-header">
                          <h4 style={{ fontSize: '14px', margin: '0' }}>{note.title}</h4>
                          <div className="dashboard-note-status">
                            {note.isPublic ? (
                              <span className="dashboard-status-badge published">🌐 Public</span>
                            ) : (
                              <span className="dashboard-status-badge draft">🔒 Private</span>
                            )}
                          </div>
                        </div>
                        <div className="dashboard-note-meta">
                          <span className="dashboard-meta-item">📚 {note.subject}</span>
                          <span className="dashboard-meta-item">👁️ {note.views} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dashboard-overview-grid">
                <div className="dashboard-overview-card">
                  <h3>👥 Users by Branch</h3>
                  <UsersByBranchChart data={stats.users.byBranch} onRefresh={loadStats} />
                </div>

                <div className="dashboard-overview-card">
                  <h3>🎓 Users by Semester</h3>
                  <UsersBySemesterChart data={stats.users.bySemester} onRefresh={loadStats} />
                </div>

                <div className="dashboard-overview-card">
                  <h3>📝 Notes by Subject</h3>
                  <NotesBySubjectChart data={stats.notes.bySubject} onRefresh={loadStats} />
                </div>
              </div>

              <div className="dashboard-overview-card">
                <h3>🔥 Most Viewed Notes Chart</h3>
                <MostViewedNotesChart notes={stats.notes.mostViewed} onRefresh={loadStats} />
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <div className="dashboard-notes-section">
              <div className="dashboard-section-header">
                <h2>👥 User Management</h2>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Manage user roles and permissions
                </div>
              </div>
              {users.length === 0 ? (
                <div className="dashboard-empty-state">
                  <h3>No users found</h3>
                  <p>No users are currently registered in the system.</p>
                </div>
              ) : (
                <div className="dashboard-notes-grid">
                  {users.map((u) => (
                    <div key={u._id} className="dashboard-note-card">
                      <div className="dashboard-note-header">
                        <h3>{u.name}</h3>
                        <div className="dashboard-note-status">
                          {u.role === "admin" ? (
                            <span className="dashboard-status-badge published">👑 Admin</span>
                          ) : (
                            <span className="dashboard-status-badge draft">👤 User</span>
                          )}
                        </div>
                      </div>
                      <div className="dashboard-note-meta">
                        <span className="dashboard-meta-item">📧 {u.email}</span>
                        <span className="dashboard-meta-item">
                          📅 {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div className="dashboard-note-actions">
                        {u.role !== "admin" ? (
                          <button
                            onClick={() => promote(u._id)}
                            className="dashboard-action-btn publish"
                            title="Make Admin"
                          >
                            👑
                          </button>
                        ) : (
                          <button
                            onClick={() => demote(u._id)}
                            className="dashboard-action-btn unpublish"
                            title="Make User"
                          >
                            👤
                          </button>
                        )}
                        {u.role !== "admin" && (
                          <button
                            onClick={() => del(u._id)}
                            className="dashboard-action-btn delete"
                            title="Delete User"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {activeTab === "notes" && (
            <div className="dashboard-notes-section">
              <div className="dashboard-section-header">
                <h2>📝 All Notes Management</h2>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Manage all notes and their visibility
                </div>
              </div>
              {notes.length === 0 ? (
                <div className="dashboard-empty-state">
                  <h3>No notes found</h3>
                  <p>No notes are currently available in the system.</p>
                </div>
              ) : (
                <div className="dashboard-notes-grid">
                  {notes.map((note) => (
                    <div key={note._id} className="dashboard-note-card">
                      <div className="dashboard-note-header">
                        <h3>{note.title}</h3>
                        <div className="dashboard-note-status">
                          {note.isPublic ? (
                            <span className="dashboard-status-badge published">🌐 Public</span>
                          ) : (
                            <span className="dashboard-status-badge draft">🔒 Private</span>
                          )}
                        </div>
                      </div>
                      <div className="dashboard-note-meta">
                        <span className="dashboard-meta-item">📚 {note.subject}</span>
                        <span className="dashboard-meta-item">📖 {note.module}</span>
                        <span className="dashboard-meta-item">🎓 Sem {note.semester}</span>
                        <span className="dashboard-meta-item">🏢 {note.branch}</span>
                      </div>
                      <div className="dashboard-note-stats">
                        <span className="dashboard-stat-item">👁️ {note.views} views</span>
                        <span className="dashboard-stat-item">📅 {new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="dashboard-note-actions">
                        <button
                          onClick={() => toggleNoteVisibility(note._id)}
                          className={note.isPublic ? "dashboard-action-btn unpublish" : "dashboard-action-btn publish"}
                          title={note.isPublic ? "Make Private" : "Make Public"}
                        >
                          {note.isPublic ? "🔒" : "🌐"}
                        </button>
                        <button
                          onClick={() => deleteNote(note._id)}
                          className="dashboard-action-btn delete"
                          title="Delete Note"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Public Notes */}
          {activeTab === "public-notes" && (
            <div className="dashboard-notes-section">
              <div className="dashboard-section-header">
                <h2>🌐 Public Notes Management</h2>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  These notes are visible to all users
                </div>
              </div>
              {publicNotes.length === 0 ? (
                <div className="dashboard-empty-state">
                  <h3>No public notes available</h3>
                  <p>No public notes are currently available in the system.</p>
                </div>
              ) : (
                <div className="dashboard-notes-grid">
                  {publicNotes.map((note) => (
                    <div key={note._id} className="dashboard-note-card">
                      <div className="dashboard-note-header">
                        <h3>{note.title}</h3>
                        <div className="dashboard-note-status">
                          <span className="dashboard-status-badge published">🌐 Public</span>
                        </div>
                      </div>
                      <div className="dashboard-note-meta">
                        <span className="dashboard-meta-item">📚 {note.subject}</span>
                        <span className="dashboard-meta-item">📖 {note.module}</span>
                        <span className="dashboard-meta-item">🎓 Sem {note.semester}</span>
                        <span className="dashboard-meta-item">🏢 {note.branch}</span>
                      </div>
                      <div className="dashboard-note-stats">
                        <span className="dashboard-stat-item">👁️ {note.views} views</span>
                        <span className="dashboard-stat-item">
                          👨‍🏫 {note.user ? note.user.name : "Unknown"}
                        </span>
                        <span className="dashboard-stat-item">📅 {new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="dashboard-note-actions">
                        <button
                          onClick={() => toggleNoteVisibility(note._id)}
                          className="dashboard-action-btn unpublish"
                          title="Make Private"
                        >
                          🔒
                        </button>
                        <button
                          onClick={() => deleteNote(note._id)}
                          className="dashboard-action-btn delete"
                          title="Delete Note"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
