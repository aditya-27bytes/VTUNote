import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import Layout from '../components/Layout';
import '../styles/NotesPage.css';

interface NoteDetail {
  _id: string;
  title: string;
  module: string;
  subject: string;
  semester: number;
  branch: string;
  summary: string;
  content: string;
  extractedText: string;
  teacherId: {
    _id: string;
    name: string;
    department: string;
    designation: string;
    college?: string;
    email?: string;
  };
  isPublic: boolean;
  views: number;
  likes: number;
  createdAt: string;
  publishedDate?: string;
  downloadUrl?: string;
  images: Array<{
    filename: string;
    url: string;
    pageNumber: number;
    description?: string;
    isImportant: boolean;
  }>;
  flashcards: Array<{
    question: string;
    answer: string;
    explanation?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
  }>;
  keyPoints: string[];
  concepts: Array<{
    term: string;
    definition: string;
    explanation: string;
  }>;
  hasImages: boolean;
  hasFlashcards: boolean;
  imageCount: number;
  flashcardCount: number;
  numPages?: number;
}

const StudentNoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'content' | 'images' | 'flashcards' | 'concepts'>('summary');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);

  useEffect(() => {
    fetchNoteDetail();
  }, [id]);

  const fetchNoteDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/student/notes/${id}`);
      if (response.data.success) {
        setNote(response.data.note);
      } else {
        throw new Error('Failed to fetch note details');
      }
    } catch (err: any) {
      console.error('Fetch note detail error:', err);
      if (err.response?.status === 404) {
        setError('Note not found or you don\'t have access to this note.');
      } else if (err.response?.status === 403) {
        setError('You don\'t have permission to access this note. Try connecting with the teacher first.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch note details');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFlashcardNavigation = (direction: 'next' | 'prev') => {
    if (!note?.flashcards.length) return;
    
    if (direction === 'next') {
      setCurrentFlashcardIndex((prev) => 
        prev >= note.flashcards.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentFlashcardIndex((prev) => 
        prev <= 0 ? note.flashcards.length - 1 : prev - 1
      );
    }
    setShowFlashcardAnswer(false);
  };

  const handleDownloadPDF = async () => {
    if (!note) return;
    
    try {
      console.log('📥 Starting teacher note PDF download for note:', note._id);
      
      // Use the public teacher note PDF serving endpoint
      const response = await apiClient.get(`/teacher-notes/public/pdf/${note._id}`, {
        responseType: 'blob', // Important for file download
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${note.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Teacher note PDF download completed');
    } catch (err: any) {
      console.error('❌ Teacher note PDF download error:', err);
      let errorMessage = 'Failed to download PDF';
      
      if (err.response?.status === 404) {
        errorMessage = 'PDF file not found. This note may not have an associated PDF file.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="page">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading note details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="page">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Note</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={fetchNoteDetail} className="retry-btn">🔄 Try Again</button>
              <Link to="/student-notes" className="back-btn">← Back to Notes</Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!note) {
    return (
      <Layout>
        <div className="page">
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Note Not Found</h3>
            <p>The requested note could not be found.</p>
            <Link to="/student-notes" className="back-btn">← Back to Notes</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page note-detail-page">
        {/* Header */}
        <div className="note-detail-header">
          <Link to="/student-notes" className="back-link">← Back to Teacher Notes</Link>
          <div className="note-title-section">
            <h1>{note.title}</h1>
            <div className="note-meta-tags">
              <span className="meta-tag module">{note.module}</span>
              <span className="meta-tag subject">{note.subject}</span>
              <span className="meta-tag semester">Semester {note.semester}</span>
              <span className="meta-tag branch">{note.branch}</span>
            </div>
          </div>
        </div>

        {/* Teacher Info */}
        <div className="teacher-info-card">
          <div className="teacher-details">
            <h3>👨‍🏫 {note.teacherId.name}</h3>
            <p>{note.teacherId.designation}, {note.teacherId.department}</p>
            {note.teacherId.college && <p>📍 {note.teacherId.college}</p>}
          </div>
          <div className="note-stats">
            <span className="stat">👁️ {note.views} views</span>
            <span className="stat">❤️ {note.likes} likes</span>
            <span className="stat">📅 {formatDate(note.publishedDate || note.createdAt)}</span>
            {note.numPages && <span className="stat">📄 {note.numPages} pages</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="note-actions-bar">
          <button 
            onClick={handleDownloadPDF}
            className="action-btn primary"
            title="Download original PDF"
          >
            📥 Download PDF
          </button>
          <div className="access-indicator">
            {note.isPublic ? '🌐 Public Note' : '🔗 Connected Teacher Note'}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="note-tabs">
          <button 
            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            📋 Summary
          </button>
          <button 
            className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            📝 Full Content
          </button>
          {note.hasImages && (
            <button 
              className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`}
              onClick={() => setActiveTab('images')}
            >
              🖼️ Images ({note.imageCount})
            </button>
          )}
          {note.hasFlashcards && (
            <button 
              className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
              onClick={() => setActiveTab('flashcards')}
            >
              🎴 Flashcards ({note.flashcardCount})
            </button>
          )}
          {note.concepts && note.concepts.length > 0 && (
            <button 
              className={`tab-btn ${activeTab === 'concepts' ? 'active' : ''}`}
              onClick={() => setActiveTab('concepts')}
            >
              🧠 Concepts ({note.concepts.length})
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'summary' && (
            <div className="summary-section">
              <div className="content-card">
                <h3>📋 AI-Generated Summary</h3>
                <div className="summary-content">
                  {note.summary ? (
                    <p>{note.summary}</p>
                  ) : (
                    <p className="no-content">No summary available for this note.</p>
                  )}
                </div>
              </div>

              {note.keyPoints && note.keyPoints.length > 0 && (
                <div className="content-card">
                  <h3>🎯 Key Points</h3>
                  <ul className="key-points-list">
                    {note.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="content-section">
              <div className="content-card">
                <h3>📝 Full Content</h3>
                <div className="full-content">
                  {note.extractedText || note.content ? (
                    <pre className="extracted-text">{note.extractedText || note.content}</pre>
                  ) : (
                    <p className="no-content">No text content available for this note.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && note.hasImages && (
            <div className="images-section">
              <div className="content-card">
                <h3>🖼️ Extracted Images</h3>
                <div className="images-grid">
                  {note.images.map((image, index) => (
                    <div key={index} className="image-card">
                      <img 
                        src={`http://localhost:5000${image.url}`} 
                        alt={image.filename}
                        className="extracted-image"
                        onClick={() => setSelectedImage(`http://localhost:5000${image.url}`)}
                      />
                      <div className="image-info">
                        <p>Page {image.pageNumber}</p>
                        {image.description && <p>{image.description}</p>}
                        {image.isImportant && <span className="important-badge">⭐ Important</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flashcards' && note.hasFlashcards && (
            <div className="flashcards-section">
              <div className="content-card">
                <h3>🎴 Flashcards</h3>
                <div className="flashcard-container">
                  <div className="flashcard-navigation">
                    <button 
                      onClick={() => handleFlashcardNavigation('prev')}
                      className="nav-btn"
                      disabled={note.flashcards.length <= 1}
                    >
                      ← Previous
                    </button>
                    <span className="flashcard-counter">
                      {currentFlashcardIndex + 1} / {note.flashcards.length}
                    </span>
                    <button 
                      onClick={() => handleFlashcardNavigation('next')}
                      className="nav-btn"
                      disabled={note.flashcards.length <= 1}
                    >
                      Next →
                    </button>
                  </div>

                  {note.flashcards[currentFlashcardIndex] && (
                    <div className="flashcard">
                      <div className="flashcard-question">
                        <h4>Question:</h4>
                        <p>{note.flashcards[currentFlashcardIndex].question}</p>
                      </div>

                      {showFlashcardAnswer ? (
                        <div className="flashcard-answer">
                          <h4>Answer:</h4>
                          <p>{note.flashcards[currentFlashcardIndex].answer}</p>
                          {note.flashcards[currentFlashcardIndex].explanation && (
                            <>
                              <h4>Explanation:</h4>
                              <p>{note.flashcards[currentFlashcardIndex].explanation}</p>
                            </>
                          )}
                          <div className="flashcard-meta">
                            <span className={`difficulty ${note.flashcards[currentFlashcardIndex].difficulty}`}>
                              {note.flashcards[currentFlashcardIndex].difficulty}
                            </span>
                            {note.flashcards[currentFlashcardIndex].tags.length > 0 && (
                              <div className="tags">
                                {note.flashcards[currentFlashcardIndex].tags.map((tag, i) => (
                                  <span key={i} className="tag">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="reveal-answer">
                          <button 
                            onClick={() => setShowFlashcardAnswer(true)}
                            className="reveal-btn"
                          >
                            🔍 Reveal Answer
                          </button>
                        </div>
                      )}

                      <button 
                        onClick={() => setShowFlashcardAnswer(false)}
                        className="reset-card-btn"
                        disabled={!showFlashcardAnswer}
                      >
                        🔄 Hide Answer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'concepts' && note.concepts && note.concepts.length > 0 && (
            <div className="concepts-section">
              <div className="content-card">
                <h3>🧠 Key Concepts</h3>
                <div className="concepts-grid">
                  {note.concepts.map((concept, index) => (
                    <div key={index} className="concept-card">
                      <h4>{concept.term}</h4>
                      <p className="definition"><strong>Definition:</strong> {concept.definition}</p>
                      {concept.explanation && (
                        <p className="explanation"><strong>Explanation:</strong> {concept.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="image-modal" onClick={() => setSelectedImage(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setSelectedImage(null)}>×</button>
              <img src={selectedImage} alt="Enlarged view" />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentNoteDetailPage;
