import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import '../styles/NotesPage.css';

interface Note {
  _id: string;
  title: string;
  module: string;
  subject: string;
  semester: number;
  branch: string;
  summary: string;
  flashcards: any[];
  keyPoints: string[];
  concepts: any[];
  isPublic: boolean;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  originalFileName?: string;
}

interface FilterState {
  module: string;
  subject: string;
  viewMode: 'my' | 'public';
}

const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    module: '',
    subject: '',
    viewMode: 'my'
  });
  const [stats, setStats] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, noteId: string, noteTitle: string}>({show: false, noteId: '', noteTitle: ''});

  const modules = ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'];
  
  const subjects = [
    'Data Structures', 'Algorithms', 'Database Management System', 'Computer Networks',
    'Operating Systems', 'Software Engineering', 'Compiler Design', 'Machine Learning',
    'Web Programming', 'Object Oriented Programming', 'Computer Graphics', 'Distributed Systems'
  ];

  useEffect(() => {
    fetchNotes();
    fetchStats();
  }, [filters]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const endpoint = filters.viewMode === 'public' ? '/notes/public' : '/notes';
      const params = new URLSearchParams();
      
      if (filters.module) params.append('module', filters.module);
      if (filters.subject) params.append('subject', filters.subject);
      if (user?.semester) params.append('semester', user.semester.toString());
      if (user?.branch) params.append('branch', user.branch);
      
      const response = await apiClient.get(`${endpoint}?${params.toString()}`);
      setNotes(response.data.notes || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (filters.viewMode === 'my') {
      try {
        const response = await apiClient.get('/notes/stats/overview');
        setStats(response.data);
      } catch (err) {
        console.warn('Failed to fetch stats:', err);
      }
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleLike = async (noteId: string) => {
    try {
      await apiClient.post(`/notes/${noteId}/like`);
      fetchNotes(); // Refresh to show updated likes
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to like note');
    }
  };

  const confirmDelete = (noteId: string, noteTitle: string) => {
    setDeleteConfirm({show: true, noteId, noteTitle});
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/notes/${deleteConfirm.noteId}`);
      setDeleteConfirm({show: false, noteId: '', noteTitle: ''});
      // Refresh notes and stats after deletion
      fetchNotes();
      if (filters.viewMode === 'my') {
        fetchStats();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete note');
      setDeleteConfirm({show: false, noteId: '', noteTitle: ''});
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({show: false, noteId: '', noteTitle: ''});
  };

  const handleDownloadPDF = async (noteId: string, originalFileName?: string, title?: string) => {
    try {
      console.log('📥 Starting PDF download for note:', noteId);
      
      // Make request to download endpoint
      const response = await apiClient.get(`/pdf/download/${noteId}`, {
        responseType: 'blob', // Important for file download
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = originalFileName || `${title || 'note'}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF download completed');
    } catch (err: any) {
      console.error('❌ PDF download error:', err);
      let errorMessage = 'Failed to download PDF';
      
      if (err.response?.status === 404) {
        errorMessage = 'PDF file not found. This note may not have an associated PDF file.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      alert(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="page">
        <div className="notes-header">
          <h2>📚 VTU NOTE Library</h2>
          <div className="action-buttons">
            <Link to="/upload" className="btn-primary">📤 Upload New PDF</Link>
          </div>
        </div>

        {/* Stats Dashboard (only for my notes) */}
        {filters.viewMode === 'my' && stats && (
          <div className="stats-dashboard">
            <div className="stat-card">
              <div className="stat-number">{stats.overview?.totalNotes || 0}</div>
              <div className="stat-label">Total Notes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.overview?.totalFlashcards || 0}</div>
              <div className="stat-label">Flashcards</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.overview?.totalViews || 0}</div>
              <div className="stat-label">Views</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.overview?.totalLikes || 0}</div>
              <div className="stat-label">Likes</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${filters.viewMode === 'my' ? 'active' : ''}`}
              onClick={() => handleFilterChange('viewMode', 'my')}
            >
              📝 My Notes
            </button>
            <button 
              className={`toggle-btn ${filters.viewMode === 'public' ? 'active' : ''}`}
              onClick={() => handleFilterChange('viewMode', 'public')}
            >
              🌐 Public Notes
            </button>
          </div>

          <div className="filter-controls">
            <select 
              value={filters.module} 
              onChange={(e) => handleFilterChange('module', e.target.value)}
              aria-label="Filter by module"
              title="Select module"
            >
              <option value="">All Modules</option>
              {modules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>

            <select 
              value={filters.subject} 
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              aria-label="Filter by subject"
              title="Select subject"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="loading-state">Loading notes...</div>
        ) : error ? (
          <div className="error-state">⚠️ {error}</div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <h3>📄 No notes found</h3>
            <p>
              {filters.viewMode === 'my' 
                ? "Start by uploading your first PDF to generate notes!"
                : "No public notes available for the selected filters."
              }
            </p>
            {filters.viewMode === 'my' && (
              <Link to="/upload" className="btn-primary">Upload PDF</Link>
            )}
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <div key={note._id} className="note-card">
                <div className="note-header">
                  <h3 className="note-title">{note.title}</h3>
                  <div className="note-meta">
                    <span className="module-badge">{note.module}</span>
                    <span className="subject-badge">{note.subject}</span>
                  </div>
                </div>
                <div className="note-content">
                  <p className="note-summary">{note.summary?.substring(0, 150)}...</p>
                </div>
                <div className="note-features">
                  <div className="feature-badges">
                    {note.flashcards?.length > 0 && <span className="feature-badge">🎯 {note.flashcards.length} Cards</span>}
                    {note.keyPoints?.length > 0 && <span className="feature-badge">🔑 {note.keyPoints.length} Points</span>}
                    {note.concepts?.length > 0 && <span className="feature-badge">🧠 {note.concepts.length} Concepts</span>}
                  </div>
                </div>
                <div className="note-footer">
                  <div className="note-stats">
                    <span>👁️ {note.views || 0}</span>
                    <span>❤️ {note.likes || 0}</span>
                    <span>📅 {formatDate(note.createdAt)}</span>
                  </div>
                  <div className="note-actions">
                    {filters.viewMode === 'public' && (
                      <button onClick={() => handleLike(note._id)} className="like-btn">👍 Like</button>
                    )}
                    {filters.viewMode === 'my' && (
                      <button onClick={() => confirmDelete(note._id, note.title)} className="delete-btn" title="Delete this note">🗑️ Delete</button>
                    )}
                    <button 
                      onClick={() => handleDownloadPDF(note._id, note.originalFileName, note.title)} 
                      className="download-btn" 
                      title="Download original PDF"
                    >
                      📥 Download
                    </button>
                    <Link to={`/notes/${note._id}`} className="view-btn">📖 View</Link>
                    {note.flashcards && note.flashcards.length > 0 && (
                      <Link to={`/quiz?noteId=${note._id}`} className="quiz-btn">🚀 Quiz</Link>
                    )}
                    {note.flashcards && note.flashcards.length > 0 && (
                      <Link to={`/flashcards`} className="flashcards-btn">🎯 Study</Link>
                    )}
                  </div>
                </div>
                {note.isPublic && <div className="public-indicator">🌐 Public</div>}
              </div>
            ))}
          </div>
        )}
      
        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>🗑️ Delete Note</h3>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this note?</p>
                <p className="note-title-confirm"><strong>"{deleteConfirm.noteTitle}"</strong></p>
                <p className="warning-text">⚠️ This action cannot be undone. All flashcards, concepts, and content will be permanently deleted.</p>
              </div>
              <div className="modal-actions">
                <button onClick={cancelDelete} className="btn-secondary">❌ Cancel</button>
                <button onClick={handleDelete} className="btn-danger">🗑️ Delete Note</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotesPage;