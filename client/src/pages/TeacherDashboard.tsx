import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacherAuth } from '../contexts/TeacherAuthContext';
import apiClient from '../utils/apiClient';
import '../styles/TeacherDashboard.css';

interface Note {
  _id: string;
  title: string;
  subject: string;
  module: string;
  semester: number;
  branch: string;
  isPublic: boolean;
  views: number;
  likes: number;
  publishedDate: string;
  createdAt: string;
}

interface NoteStats {
  totalNotes: number;
  publicNotes: number;
  privateNotes: number;
  totalViews: number;
  totalLikes: number;
}

interface NewNoteForm {
  title: string;
  subject: string;
  module: string;
  semester: number | string;
  branch: string;
  content: string;
  isPublic: boolean;
  pdfFile: File | null;
  useAI: boolean;
  aiPrompt: string;
}

const TeacherDashboard: React.FC = () => {
  const { teacher, logout } = useTeacherAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<NoteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNote, setNewNote] = useState<NewNoteForm>({
    title: '',
    subject: '',
    module: '',
    semester: '',
    branch: '',
    content: '',
    isPublic: false,
    pdfFile: null,
    useAI: false,
    aiPrompt: ''
  });

  useEffect(() => {
    if (!teacher) {
      navigate('/teacher/login');
      return;
    }
    loadDashboard();
  }, [teacher, navigate]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      console.log('Loading teacher dashboard...');
      console.log('Teacher info:', teacher);
      
      // Use apiClient with correct endpoints
      const [notesResponse, statsResponse] = await Promise.all([
        apiClient.get('/teacher-notes'),
        apiClient.get('/teacher-notes/stats')
      ]);

      console.log('Notes response:', notesResponse.data);
      console.log('Stats response:', statsResponse.data);
      
      setNotes(notesResponse.data);
      setStats(statsResponse.data);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Set empty states if there's an error
      setNotes([]);
      setStats({
        totalNotes: 0,
        publicNotes: 0,
        privateNotes: 0,
        totalViews: 0,
        totalLikes: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/teacher/login');
  };

  const handlePublishNote = async (noteId: string) => {
    try {
      await apiClient.put(`/teacher-notes/${noteId}/publish`);
      loadDashboard(); // Reload data
    } catch (error) {
      console.error('Error publishing note:', error);
      alert('Failed to publish note. Please try again.');
    }
  };

  const handleUnpublishNote = async (noteId: string) => {
    try {
      await apiClient.put(`/teacher-notes/${noteId}/unpublish`);
      loadDashboard(); // Reload data
    } catch (error) {
      console.error('Error unpublishing note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await apiClient.delete(`/teacher-notes/${noteId}`);
        loadDashboard(); // Reload data
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0] || null;
      setNewNote(prev => ({
        ...prev,
        [name]: file
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewNote(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setNewNote(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewNote(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newNote.title || !newNote.subject || !newNote.module || !newNote.semester || !newNote.branch) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Validate that either content or PDF is provided
    if (!newNote.content && !newNote.pdfFile) {
      alert('Please provide either note content or upload a PDF file');
      return;
    }
    
    // Validate AI prompt if AI is enabled
    if (newNote.useAI && !newNote.aiPrompt) {
      alert('Please provide AI instructions when AI enhancement is enabled');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData for multipart submission (needed for file upload)
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', newNote.title);
      formData.append('subject', newNote.subject);
      formData.append('module', newNote.module);
      formData.append('semester', String(newNote.semester));
      formData.append('branch', newNote.branch);
      formData.append('isPublic', String(newNote.isPublic));
      formData.append('noteType', 'teacher');
      formData.append('useAI', String(newNote.useAI));
      
      // Add content if provided
      if (newNote.content) {
        formData.append('content', newNote.content);
      }
      
      // Add AI prompt if provided
      if (newNote.useAI && newNote.aiPrompt) {
        formData.append('aiPrompt', newNote.aiPrompt);
      }
      
      // Add PDF file if provided
      if (newNote.pdfFile) {
        formData.append('file', newNote.pdfFile);
      }
      
      // Create using apiClient
      const { data } = await apiClient.post('/teacher-notes', formData);
      console.log('Note created:', data);
      
      // Reset form
      setNewNote({
        title: '',
        subject: '',
        module: '',
        semester: '',
        branch: '',
        content: '',
        isPublic: false,
        pdfFile: null,
        useAI: false,
        aiPrompt: ''
      });
      
      // Show success message
      alert('Note created successfully!');
      
      // Reload dashboard data and switch to notes tab
      await loadDashboard();
      setActiveTab('notes');
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-page">
      {/* Header Card */}
      <div className="dashboard-header-card">
        <div className="dashboard-header-content">
          <div className="dashboard-header-left">
            <div className="dashboard-header-avatar">
              {teacher?.profileImage ? (
                <img src={teacher.profileImage} alt={teacher.name} />
              ) : (
                <span className="avatar-icon">👨‍🏫</span>
              )}
            </div>
            <div className="dashboard-header-info">
              <h1 className="dashboard-title">Teacher Dashboard</h1>
              <h3 className="dashboard-name">{teacher?.name}</h3>
              <div className="dashboard-meta">
                <span>{teacher?.designation} • {teacher?.department}</span>
                <span>{teacher?.college}</span>
              </div>
            </div>
          </div>
          <div className="dashboard-header-right">
            <button onClick={handleLogout} className="dashboard-logout-btn">Logout</button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs-row">
        <button 
          className={`dashboard-tab-btn${activeTab === 'overview' ? ' active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >📊 Overview</button>
        <button 
          className={`dashboard-tab-btn${activeTab === 'notes' ? ' active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >📝 My Notes</button>
        <button 
          className={`dashboard-tab-btn${activeTab === 'create' ? ' active' : ''}`}
          onClick={() => setActiveTab('create')}
        >➕ Create Note</button>
        <button 
          className={`dashboard-tab-btn${activeTab === 'profile' ? ' active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >👤 Profile</button>
        <button 
          className="dashboard-tab-btn"
          onClick={() => navigate('/teacher/connections')}
        >🔗 Connections</button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">📝</div>
            <div className="dashboard-stat-info">
              <div className="dashboard-stat-number">{stats.totalNotes}</div>
              <div className="dashboard-stat-label">Total Notes</div>
            </div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">👁️</div>
            <div className="dashboard-stat-info">
              <div className="dashboard-stat-number">{stats.totalViews}</div>
              <div className="dashboard-stat-label">Total Views</div>
            </div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">❤️</div>
            <div className="dashboard-stat-info">
              <div className="dashboard-stat-number">{stats.totalLikes}</div>
              <div className="dashboard-stat-label">Total Likes</div>
            </div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">🌐</div>
            <div className="dashboard-stat-info">
              <div className="dashboard-stat-number">{stats.publicNotes}</div>
              <div className="dashboard-stat-label">Published Notes</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="dashboard-tab-content">
        {activeTab === 'overview' && (
          <div className="dashboard-overview-section">
            <h2 className="dashboard-welcome-title">Welcome back, {teacher?.name}!</h2>
            <div className="dashboard-overview-grid">
              <div className="dashboard-overview-card">
                <h3>📚 Your Subjects</h3>
                <div className="dashboard-subjects-list">
                  {teacher?.subjects.map((subject, index) => (
                    <span key={index} className="dashboard-subject-tag">{subject}</span>
                  ))}
                </div>
              </div>
              <div className="dashboard-overview-card">
                <h3>📈 Recent Activity</h3>
                <div className="dashboard-recent-activity">
                  {notes.length > 0 ? (
                    <div className="dashboard-activity-list">
                      {notes.slice(0, 3).map(note => (
                        <div key={note._id} className="dashboard-activity-item">
                          <span className="dashboard-activity-icon">{note.isPublic ? '🌐' : '📝'}</span>
                          <div className="dashboard-activity-content">
                            <p className="dashboard-activity-title">{note.title}</p>
                            <p className="dashboard-activity-meta">
                              {note.subject} • {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No recent activity. Create your first note!</p>
                  )}
                </div>
              </div>
              <div className="dashboard-overview-card">
                <h3>⚡ Quick Actions</h3>
                <div className="dashboard-quick-actions">
                  <button 
                    onClick={() => setActiveTab('create')}
                    className="dashboard-action-btn create-btn"
                  >➕ Create New Note</button>
                  <button 
                    onClick={() => setActiveTab('notes')}
                    className="dashboard-action-btn manage-btn"
                  >📝 Manage Notes</button>
                  <button 
                    onClick={() => navigate('/teacher/quizzes')}
                    className="dashboard-action-btn quiz-btn"
                  >🧪 Manage Quizzes</button>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="dashboard-action-btn profile-btn"
                  >👤 Edit Profile</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="dashboard-notes-section">
            <div className="dashboard-section-header">
              <h2>My Notes</h2>
              <button 
                onClick={() => setActiveTab('create')}
                className="dashboard-create-btn"
              >➕ Create New Note</button>
            </div>
            {notes.length === 0 ? (
              <div className="dashboard-empty-state">
                <h3>No notes yet</h3>
                <p>Start creating your first note to share with students!</p>
                <button 
                  onClick={() => setActiveTab('create')}
                  className="dashboard-create-btn"
                >Create Your First Note</button>
              </div>
            ) : (
              <div className="dashboard-notes-grid">
                {notes.map((note) => (
                  <div key={note._id} className="dashboard-note-card">
                    <div className="dashboard-note-header">
                      <h3>{note.title}</h3>
                      <div className="dashboard-note-status">
                        {note.isPublic ? (
                          <span className="dashboard-status-badge published">🌐 Published</span>
                        ) : (
                          <span className="dashboard-status-badge draft">📝 Draft</span>
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
                      <span className="dashboard-stat-item">❤️ {note.likes} likes</span>
                    </div>
                    <div className="dashboard-note-actions">
                      <button 
                        onClick={() => {
                          console.log('Navigating to note:', note._id);
                          navigate(`/teacher/notes/${note._id}`);
                        }}
                        className="dashboard-action-btn view"
                      >👁️ View</button>
                      <button 
                        onClick={() => navigate(`/teacher/notes/${note._id}/edit`)}
                        className="dashboard-action-btn edit"
                      >✏️ Edit</button>
                      {note.isPublic ? (
                        <button 
                          onClick={() => handleUnpublishNote(note._id)}
                          className="dashboard-action-btn unpublish"
                        >🔒 Unpublish</button>
                      ) : (
                        <button 
                          onClick={() => handlePublishNote(note._id)}
                          className="dashboard-action-btn publish"
                        >🌐 Publish</button>
                      )}
                      <button 
                        onClick={() => handleDeleteNote(note._id)}
                        className="dashboard-action-btn delete"
                      >🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="dashboard-create-section">
            <h2>Create New Note</h2>
            <form className="dashboard-note-form" onSubmit={handleCreateNote}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newNote.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter note title"
                  className="form-input"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={newNote.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter subject"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="module">Module</label>
                  <input
                    type="text"
                    id="module"
                    name="module"
                    value={newNote.module}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter module"
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="semester">Semester</label>
                  <select
                    id="semester"
                    name="semester"
                    value={newNote.semester}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="branch">Branch</label>
                  <input
                    type="text"
                    id="branch"
                    name="branch"
                    value={newNote.branch}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter branch"
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="pdfUpload">Upload PDF</label>
                <input
                  type="file"
                  id="pdfUpload"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setNewNote(prev => ({ ...prev, pdfFile: file }));
                  }}
                  className="form-input"
                />
                <small>Upload a PDF file instead of typing content</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="content">Note Content (Optional if PDF is uploaded)</label>
                <textarea
                  id="content"
                  name="content"
                  value={newNote.content}
                  onChange={handleInputChange}
                  placeholder="Enter note content or upload a PDF"
                  className="form-textarea"
                  rows={6}
                />
              </div>
              
              <div className="form-group checkbox">
                <input
                    type="checkbox"
                    id="useAI"
                    name="useAI"
                    checked={newNote.useAI}
                    onChange={handleInputChange}
                    className="form-checkbox"
                  />
                <label htmlFor="useAI">Use AI to enhance notes</label>
              </div>
              
              {newNote.useAI && (
                <div className="form-group">
                  <label htmlFor="aiPrompt">AI Instructions</label>
                  <textarea
                    id="aiPrompt"
                    name="aiPrompt"
                    value={newNote.aiPrompt}
                    onChange={handleInputChange}
                    placeholder="Example: Generate practice questions from this content, Create a summary of key points, etc."
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={newNote.isPublic}
                    onChange={handleCheckboxChange}
                  />
                  Publish immediately
                </label>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setActiveTab('notes')}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="dashboard-profile-section">
            <h2>Teacher Profile</h2>
            <div className="profile-details">
              <div className="profile-field">
                <label>Name:</label>
                <span>{teacher?.name}</span>
              </div>
              <div className="profile-field">
                <label>Email:</label>
                <span>{teacher?.email}</span>
              </div>
              <div className="profile-field">
                <label>Employee ID:</label>
                <span>{teacher?.employeeId}</span>
              </div>
              <div className="profile-field">
                <label>Department:</label>
                <span>{teacher?.department}</span>
              </div>
              <div className="profile-field">
                <label>Designation:</label>
                <span>{teacher?.designation}</span>
              </div>
              <div className="profile-field">
                <label>Qualification:</label>
                <span>{teacher?.qualification}</span>
              </div>
              <div className="profile-field">
                <label>Experience:</label>
                <span>{teacher?.experience} years</span>
              </div>
              <div className="profile-field">
                <label>College:</label>
                <span>{teacher?.college}</span>
              </div>
              <div className="profile-field">
                <label>Subjects:</label>
                <div className="subjects-list">
                  {teacher?.subjects.map((subject, index) => (
                    <span key={index} className="subject-tag">{subject}</span>
                  ))}
                </div>
              </div>
              {teacher?.bio && (
                <div className="profile-field">
                  <label>Bio:</label>
                  <p>{teacher.bio}</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => navigate('/teacher/profile/edit')}
              className="edit-profile-btn"
            >
              ✏️ Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
