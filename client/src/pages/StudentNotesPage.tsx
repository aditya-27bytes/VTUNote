import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import '../styles/NotesPage.css';

interface Note {
  _id: string;
  title: string;
  module: string;
  subject: string;
  semester: number;
  branch: string;
  summary: string;
  teacherId?: {
    name: string;
    department: string;
    designation: string;
    college?: string;
  };
  isPublic: boolean;
  views: number;
  likes: number;
  createdAt: string;
  publishedDate?: string;
  downloadUrl?: string;
  hasImages: boolean;
  hasFlashcards: boolean;
  imageCount: number;
  flashcardCount: number;
  isConnectedTeacher?: boolean;
}

interface ApiResponse {
  notes: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    modules: string[];
    subjects: string[];
    branches: string[];
    semesters: number[];
    teachers: string[];
  };
  stats: {
    totalPublic: number;
    totalConnected: number;
    totalUnique: number;
    connectedTeachers: number;
  };
  success: boolean;
}

const modules = ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'];
const subjects = [
  'Data Structures', 'Algorithms', 'Database Management System', 'Computer Networks',
  'Operating Systems', 'Software Engineering', 'Compiler Design', 'Machine Learning',
  'Web Programming', 'Object Oriented Programming', 'Computer Graphics', 'Distributed Systems'
];

const StudentNotesPage: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    module: '',
    subject: '',
    branch: user?.branch || '',
    semester: user?.semester || '',
    teacher: ''
  });

  useEffect(() => {
    fetchNotes();
  }, [filters, currentPage, searchTerm, sortBy]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filters.module) params.append('module', filters.module);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.branch) params.append('branch', filters.branch);
      if (filters.semester) params.append('semester', filters.semester.toString());
      if (filters.teacher) params.append('teacher', filters.teacher);
      if (searchTerm) params.append('search', searchTerm);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', currentPage.toString());
      params.append('limit', '12');
      
      const response = await apiClient.get(`/student/notes?${params.toString()}`);
      if (response.data.success) {
        setApiData(response.data);
        setNotes(response.data.notes || []);
      } else {
        throw new Error('Failed to fetch notes');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch notes');
      setNotes([]);
      setApiData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const resetFilters = () => {
    setFilters({
      module: '',
      subject: '',
      branch: '',
      semester: '',
      teacher: ''
    });
    setSearchTerm('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="page">
        <div className="notes-header">
          <h1>📚 Teacher Notes Library</h1>
          {apiData && (
            <div className="stats-summary">
              <span>📊 Total: {apiData.stats.totalUnique}</span>
              <span>🌐 Public: {apiData.stats.totalPublic}</span>
              <span>👥 From Connected Teachers: {apiData.stats.totalConnected}</span>
              <span>🔗 Connected Teachers: {apiData.stats.connectedTeachers}</span>
            </div>
          )}
        </div>

        {/* Search and Sort Controls */}
        <div className="search-sort-section">
          <div className="search-controls">
            <input 
              type="text" 
              placeholder="🔍 Search notes by title, summary, or content..." 
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
            <select 
              value={sortBy} 
              onChange={(e) => handleSortChange(e.target.value)}
              className="sort-select"
            >
              <option value="newest">📅 Newest First</option>
              <option value="oldest">📅 Oldest First</option>
              <option value="popular">👁️ Most Viewed</option>
              <option value="liked">❤️ Most Liked</option>
              <option value="alphabetical">🔤 A-Z</option>
            </select>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filter-controls">
            <select 
              value={filters.module} 
              onChange={e => handleFilterChange('module', e.target.value)} 
              title="Select module"
            >
              <option value="">All Modules</option>
              {(apiData?.filters.modules || modules).map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
            <select 
              value={filters.subject} 
              onChange={e => handleFilterChange('subject', e.target.value)} 
              title="Select subject"
            >
              <option value="">All Subjects</option>
              {(apiData?.filters.subjects || subjects).map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select 
              value={filters.branch} 
              onChange={e => handleFilterChange('branch', e.target.value)} 
              title="Select branch"
            >
              <option value="">All Branches</option>
              {apiData?.filters.branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
            <select 
              value={filters.semester} 
              onChange={e => handleFilterChange('semester', e.target.value)} 
              title="Select semester"
            >
              <option value="">All Semesters</option>
              {apiData?.filters.semesters.map(sem => (
                <option key={sem} value={sem.toString()}>Semester {sem}</option>
              ))}
            </select>
            <select 
              value={filters.teacher} 
              onChange={e => handleFilterChange('teacher', e.target.value)} 
              title="Select teacher"
            >
              <option value="">All Teachers</option>
              {apiData?.filters.teachers.map(teacher => (
                <option key={teacher} value={teacher}>{teacher}</option>
              ))}
            </select>
            <button onClick={resetFilters} className="reset-filters-btn">🔄 Reset</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading teacher notes...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Notes</h3>
            <p>{error}</p>
            <button onClick={fetchNotes} className="retry-btn">🔄 Try Again</button>
          </div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No Teacher Notes Found</h3>
            <p>No notes available for the selected filters.</p>
            <p>Try adjusting your search criteria or connecting with more teachers.</p>
            <button onClick={resetFilters} className="reset-btn">🔄 Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="notes-grid">
              {notes.map(note => (
                <div key={note._id} className={`note-card ${note.isConnectedTeacher ? 'connected-teacher' : 'public'}`}>
                  <div className="note-header">
                    <h3 className="note-title">{note.title}</h3>
                    <div className="note-meta">
                      <span className="module-badge">{note.module}</span>
                      <span className="subject-badge">{note.subject}</span>
                      <span className="semester-badge">Sem {note.semester}</span>
                      {note.teacherId && (
                        <span className="teacher-badge">
                          👨‍🏫 {note.teacherId.name}
                          {note.teacherId.designation && (
                            <small>, {note.teacherId.designation}</small>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="note-content">
                    <p className="note-summary">
                      {note.summary ? 
                        (note.summary.length > 150 ? note.summary.substring(0, 150) + '...' : note.summary) :
                        'No summary available'
                      }
                    </p>
                  </div>
                  
                  {/* Additional Features */}
                  <div className="note-features">
                    {note.downloadUrl && (
                      <span className="feature-badge pdf-badge">📄 PDF</span>
                    )}
                    {note.hasImages && (
                      <span className="feature-badge image-badge">🖼️ {note.imageCount} Images</span>
                    )}
                    {note.hasFlashcards && (
                      <span className="feature-badge flashcard-badge">🎴 {note.flashcardCount} Cards</span>
                    )}
                  </div>
                  
                  <div className="note-footer">
                    <div className="note-stats">
                      <span className="stat-item">👁️ {note.views || 0}</span>
                      <span className="stat-item">❤️ {note.likes || 0}</span>
                      <span className="stat-item">📅 {formatDate(note.publishedDate || note.createdAt)}</span>
                    </div>
                    <div className="note-actions">
                      {note.downloadUrl && (
                        <a 
                          href={`http://localhost:5000${note.downloadUrl}`} 
                          download 
                          className="action-btn download-btn"
                          title="Download PDF"
                        >
                          📥
                        </a>
                      )}
                      <a 
                        href={`/student-notes/${note._id}`} 
                        className="action-btn view-btn"
                        title="View Details"
                      >
                        📖 View
                      </a>
                    </div>
                  </div>
                  
                  {/* Access Indicator */}
                  <div className={`access-indicator ${note.isPublic ? 'public' : 'connected'}`}>
                    {note.isPublic ? '🌐 Public' : '🔗 Connected Teacher'}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {apiData && apiData.pagination.pages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!apiData.pagination.hasPrev}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <div className="pagination-info pagination-info-centered">
                  <span style={{ fontWeight: 600, fontSize: '18px' }}>{apiData.pagination.page}</span>
                  <span style={{ fontWeight: 400, fontSize: '16px' }}>/ {apiData.pagination.pages}</span>
                </div>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!apiData.pagination.hasNext}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default StudentNotesPage;
