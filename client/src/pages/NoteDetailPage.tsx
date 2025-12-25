import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import Layout from '../components/Layout';
import '../styles/NoteDetailPage.css';

interface Note {
  _id: string;
  title: string;
  module: string;
  subject: string;
  semester: number;
  branch: string;
  summary: string;
  extractedText: string; // Changed from fullText to match server model
  flashcards: Flashcard[];
  keyPoints: string[];
  concepts: Concept[];
  isPublic: boolean;
  views: number;
  likes: number;
  originalFileName?: string;
  createdAt: string;
  updatedAt: string;
}

interface Flashcard {
  question: string;
  answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Concept {
  term: string;
  definition: string;
  examples: string[];
}

interface TextHighlight {
  id: string;
  startIndex: number;
  endIndex: number;
  text: string;
  color: string;
  note?: string;
}

interface QAItem {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  isLoading?: boolean;
}

const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'fulltext' | 'flashcards' | 'concepts' | 'qna'>('summary');
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  
  // Q&A Feature State
  const [qaItems, setQAItems] = useState<QAItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('perplexity');

  // Map provider ids to generic model labels shown in the UI
  const getModelLabel = (prov: string | undefined) => {
    switch (prov) {
      case 'perplexity':
        return 'Model 1';
      case 'openai':
        return 'Model 2';
      case 'gemini':
        return 'Model 3';
      case 'huggingface':
        return 'Model 4';
      default:
        return 'Model';
    }
  };

  useEffect(() => {
    if (id) {
      fetchNoteDetails();
    }
  }, [id]);

  useEffect(() => {
    if (searchTerm && note?.extractedText) {
      performSearch();
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
    }
  }, [searchTerm, note?.extractedText]);

  const fetchNoteDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/notes/${id}`);
      setNote(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch note details');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = () => {
    if (!searchTerm || !note?.extractedText) return;
    
    const regex = new RegExp(searchTerm, 'gi');
    const matches = [];
    let match;
    
    while ((match = regex.exec(note.extractedText)) !== null) {
      matches.push(match.index);
    }
    
    setSearchResults(matches);
    setCurrentSearchIndex(matches.length > 0 ? 0 : -1);
    
    if (matches.length > 0) {
      scrollToSearchResult(0);
    }
  };

  const scrollToSearchResult = (index: number) => {
    const element = document.querySelector(`[data-search-index="${index}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
    } else {
      newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
    }
    
    setCurrentSearchIndex(newIndex);
    scrollToSearchResult(newIndex);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selectedText);
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setShowHighlightMenu(true);
    } else {
      setShowHighlightMenu(false);
    }
  };

  const addHighlight = (color: string) => {
    if (!selectedText || !note?.extractedText) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const startIndex = note.extractedText.indexOf(selectedText);
    
    if (startIndex !== -1) {
      const newHighlight: TextHighlight = {
        id: Date.now().toString(),
        startIndex,
        endIndex: startIndex + selectedText.length,
        text: selectedText,
        color,
        note: ''
      };
      
      setHighlights(prev => [...prev, newHighlight]);
    }
    
    setShowHighlightMenu(false);
    selection.removeAllRanges();
  };

  const removeHighlight = (highlightId: string) => {
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
  };

  const renderHighlightedText = (text: string) => {
    if (highlights.length === 0 && searchResults.length === 0) {
      return <span>{text}</span>;
    }
    
    const elements = [];
    let currentIndex = 0;
    
    // Combine highlights and search results
    const allMarkers = [
      ...highlights.map(h => ({ type: 'highlight', ...h })),
      ...searchResults.map((index, i) => ({
        type: 'search',
        id: `search-${i}`,
        startIndex: index,
        endIndex: index + searchTerm.length,
        color: i === currentSearchIndex ? '#ffeb3b' : '#fff3e0'
      }))
    ].sort((a, b) => a.startIndex - b.startIndex);
    
    allMarkers.forEach((marker, index) => {
      // Add text before marker
      if (marker.startIndex > currentIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {text.substring(currentIndex, marker.startIndex)}
          </span>
        );
      }
      
      // Add marker
      const markerText = text.substring(marker.startIndex, marker.endIndex);
      if (marker.type === 'highlight') {
        elements.push(
          <span
            key={marker.id}
            className="text-highlight"
            style={{ backgroundColor: marker.color }}
            onDoubleClick={() => removeHighlight(marker.id)}
            title="Double-click to remove highlight"
          >
            {markerText}
          </span>
        );
      } else {
        elements.push(
          <span
            key={marker.id}
            className={`search-highlight ${marker.color === '#ffeb3b' ? 'current' : ''}`}
            data-search-index={searchResults.indexOf(marker.startIndex)}
          >
            {markerText}
          </span>
        );
      }
      
      currentIndex = Math.max(currentIndex, marker.endIndex);
    });
    
    // Add remaining text
    if (currentIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.substring(currentIndex)}
        </span>
      );
    }
    
    return <div>{elements}</div>;
  };

  const handleLike = async () => {
    if (!note) return;
    
    try {
      await apiClient.post(`/notes/${note._id}/like`);
      setNote(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to like note');
    }
  };

  const handleDownloadPDF = async () => {
    if (!note) return;
    
    try {
      console.log('📥 Starting PDF download for note:', note._id);
      
      // Make request to download endpoint
      const response = await apiClient.get(`/pdf/download/${note._id}`, {
        responseType: 'blob', // Important for file download
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = note.originalFileName || `${note.title}.pdf`;
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

  const askQuestion = async () => {
    if (!currentQuestion.trim() || !note) return;
    
    const questionId = Date.now().toString();
    const newQA: QAItem = {
      id: questionId,
      question: currentQuestion.trim(),
      answer: '',
      timestamp: new Date(),
      isLoading: true
    };
    
    setQAItems(prev => [...prev, newQA]);
    setCurrentQuestion('');
    setIsAskingQuestion(true);
    
    try {
      console.log('🚀 Making Q&A request with:', {
        question: currentQuestion.trim(),
        contextKeys: Object.keys({
          noteTitle: note.title,
          subject: note.subject,
          module: note.module,
          branch: note.branch,
          semester: note.semester,
          extractedText: note.extractedText,
          summary: note.summary
        }),
        fullTextLength: note.extractedText?.length || 0
      });
      
      const response = await apiClient.post('/ai/qa', {
        question: currentQuestion.trim(),
        provider: selectedProvider,
        context: {
          noteTitle: note.title,
          subject: note.subject,
          module: note.module,
          branch: note.branch,
          semester: note.semester,
          fullText: note.extractedText,
          summary: note.summary
        }
      });
      
      // Parse the response - handle both string and object responses
      // Show full, detailed answer from backend
      let formattedAnswer = response.data.answer;
      if (typeof formattedAnswer === 'object') {
        formattedAnswer = JSON.stringify(formattedAnswer, null, 2);
      }
      // Do not truncate or extract first paragraph; show full answer
      setQAItems(prev => prev.map(qa => 
        qa.id === questionId 
          ? { ...qa, answer: formattedAnswer, isLoading: false }
          : qa
      ));
    } catch (err: any) {
      console.error('❌ Q&A Error Details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        fullError: err
      });
      
      setQAItems(prev => prev.map(qa => 
        qa.id === questionId 
          ? { ...qa, answer: 'Sorry, I encountered an error while processing your question. Please try again.', isLoading: false }
          : qa
      ));
    } finally {
      setIsAskingQuestion(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">Loading note details...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error-state">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <Link to="/notes" className="btn-primary">← Back to Notes</Link>
        </div>
      </Layout>
    );
  }

  if (!note) {
    return (
      <Layout>
        <div className="error-state">
          <h3>📝 Note Not Found</h3>
          <p>The requested note could not be found.</p>
          <Link to="/notes" className="btn-primary">← Back to Notes</Link>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
  <div className="note-detail-page">
        {/* Header */}
  <div className="note-detail-header">
          <div className="header-top">
            <Link to="/notes" className="back-btn">← Back to Notes</Link>
            <div className="note-meta">
              <span className="views">👁️ {note.views} views</span>
              <span className="likes">❤️ {note.likes} likes</span>
            </div>
          </div>
        
          <div className="note-title-section">
            <h1>{note.title}</h1>
            <div className="note-badges">
              <span className="module-badge">{note.module}</span>
              <span className="subject-badge">{note.subject}</span>
              <span className="semester-badge">Sem {note.semester}</span>
              <span className="branch-badge">{note.branch}</span>
              {note.isPublic && <span className="public-badge">🌐 Public</span>}
            </div>
          </div>
        
          <div className="note-actions">
            <button onClick={handleLike} className="like-btn">
              👍 Like This Note
            </button>
            <button onClick={handleDownloadPDF} className="download-btn">
              📥 Download PDF
            </button>
            <Link to={`/flashcards?noteId=${note._id}`} className="study-btn">
              🎯 Study Flashcards
            </Link>
          </div>
        </div>

        {/* Search Bar (only for fulltext tab) */}
        {activeTab === 'fulltext' && (
          <div className="search-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search in document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchResults.length > 0 && (
                <div className="search-controls">
                  <span className="search-info">
                    {currentSearchIndex + 1} of {searchResults.length}
                  </span>
                  <button onClick={() => navigateSearch('prev')} className="nav-btn">↑</button>
                  <button onClick={() => navigateSearch('next')} className="nav-btn">↓</button>
                </div>
              )}
            </div>
          
            <div className="highlight-toolbar">
              <span>Highlight colors:</span>
              <button 
                onClick={() => addHighlight('#ffeb3b')} 
                className="highlight-color yellow"
                title="Yellow highlight"
              ></button>
              <button 
                onClick={() => addHighlight('#4caf50')} 
                className="highlight-color green"
                title="Green highlight"
              ></button>
              <button 
                onClick={() => addHighlight('#2196f3')} 
                className="highlight-color blue"
                title="Blue highlight"
              ></button>
              <button 
                onClick={() => addHighlight('#ff9800')} 
                className="highlight-color orange"
                title="Orange highlight"
              ></button>
              <button 
                onClick={() => setHighlights([])} 
                className="clear-highlights-btn"
                title="Clear all highlights"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="note-tabs">
          <button className={`tab-btn${activeTab === 'summary' ? ' active' : ''}`} onClick={() => setActiveTab('summary')}>📄 Summary</button>
          <button className={`tab-btn${activeTab === 'fulltext' ? ' active' : ''}`} onClick={() => setActiveTab('fulltext')}>📖 Full Text</button>
          <button className={`tab-btn${activeTab === 'flashcards' ? ' active' : ''}`} onClick={() => setActiveTab('flashcards')}>🎯 Flashcards ({note.flashcards?.length || 0})</button>
          <button className={`tab-btn${activeTab === 'concepts' ? ' active' : ''}`} onClick={() => setActiveTab('concepts')}>🧠 Concepts ({note.concepts?.length || 0})</button>
          <button className={`tab-btn${activeTab === 'qna' ? ' active' : ''}`} onClick={() => setActiveTab('qna')}>💬 Ask AI ({qaItems.length})</button>
        </div>

        {/* Content */}
        <div className="note-content">
          {activeTab === 'summary' && (
            <div className="summary-content">
              <div className="content-section">
                <h3>📝 AI-Generated Summary</h3>
                <div className="summary-text">{note.summary || 'No summary available.'}</div>
              </div>
              {note.keyPoints && note.keyPoints.length > 0 && (
                <div className="content-section">
                  <h3>🔑 Key Points</h3>
                  <ul className="key-points-list">
                    {note.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'fulltext' && (
            <div 
              className="fulltext-content"
              onMouseUp={handleTextSelection}
            >
              {note.extractedText ? renderHighlightedText(note.extractedText) : (
                <p className="no-content">Full text not available for this note.</p>
              )}
            </div>
          )}

          {activeTab === 'flashcards' && (
            <div className="flashcards-content">
              {note.flashcards && note.flashcards.length > 0 ? (
                <div className="flashcards-grid">
                  {note.flashcards.map((card, index) => (
                    <div key={index} className="flashcard-preview">
                      <div className="card-difficulty">
                        <span className={`difficulty ${card.difficulty}`}>
                          {card.difficulty.toUpperCase()}
                        </span>
                      </div>
                      <div className="card-question">
                        <h4>Q: {card.question}</h4>
                      </div>
                      <div className="card-answer">
                        <p><strong>A:</strong> {card.answer}</p>
                      </div>
                      {card.explanation && (
                        <div className="card-explanation">
                          <p><strong>💡 Explanation:</strong> {card.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-content">No flashcards available for this note.</p>
              )}
            </div>
          )}

          {activeTab === 'concepts' && (
            <div className="concepts-content">
              {note.concepts && note.concepts.length > 0 ? (
                <div className="concepts-list">
                  {note.concepts.map((concept, index) => (
                    <div key={index} className="concept-card">
                      <h4 className="concept-term">{concept.term}</h4>
                      <p className="concept-definition">{concept.definition}</p>
                      {concept.examples && concept.examples.length > 0 && (
                        <div className="concept-examples">
                          <strong>Examples:</strong>
                          <ul>
                            {concept.examples.map((example, exIndex) => (
                              <li key={exIndex}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-content">No concepts available for this note.</p>
              )}
            </div>
          )}

          {activeTab === 'qna' && (
            <div className="qna-content">
              <div className="qna-header">
                <h3>💬 Ask Questions About This Document</h3>
                <p>Get VTU-aligned answers based on the content of this document.</p>
              </div>
            
              <div className="question-input-section">
                <div className="ai-provider-selection">
                  <label htmlFor="ai-provider">🤖 Choose AI Provider:</label>
                  <select 
                    id="ai-provider"
                    value={selectedProvider} 
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="ai-provider-select"
                    disabled={isAskingQuestion}
                  >
                    <option value="perplexity">Model 1 (Recommended)</option>
                    <option value="openai">Model 2</option>
                    <option value="gemini">Model 3</option>
                    <option value="huggingface">Model 4</option>
                  </select>
                </div>
              
                <div className="question-input-container">
                  <textarea
                    placeholder="Ask any question about this document... (e.g., 'What are the key concepts?', 'Explain the main topics', 'What should I focus on for VTU exams?')"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    className="question-input"
                    rows={3}
                    disabled={isAskingQuestion}
                  />
                  <button 
                    onClick={askQuestion}
                    disabled={!currentQuestion.trim() || isAskingQuestion}
                    className="ask-btn"
                  >
                    {isAskingQuestion ? (
                      <>
                        <div className="spinner"></div>
                        Asking AI...
                      </>
                    ) : (
                      <>
                        🤖 Ask AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="qa-history">
                {qaItems.length === 0 ? (
                  <div className="no-questions">
                    <p>💭 No questions asked yet. Start by asking something about this document!</p>
                  </div>
                ) : (
                  <div className="qa-list">
                    {qaItems.map((qa) => (
                      <div key={qa.id} className="qa-item">
                        <div className="question-section">
                          <div className="question-header">
                            <span className="question-icon">❓</span>
                            <span className="question-label">Your Question</span>
                            <span className="question-time">{qa.timestamp.toLocaleTimeString()}</span>
                          </div>
                          <div className="question-text">{qa.question}</div>
                        </div>
                      
                        <div className="answer-section">
                          <div className="answer-header">
                            <span className="answer-icon">🤖</span>
                            <span className="answer-label">VTU AI Assistant</span>
                          </div>
                          <div className="answer-text">
                            {qa.isLoading ? (
                              <div className="loading-answer">
                                <div className="spinner"></div>
                                <span>Analyzing document and generating VTU-aligned answer...</span>
                              </div>
                            ) : (
                              <div className="answer-content">
                                {typeof qa.answer === 'string' ? (
                                  qa.answer.split(/\n\n|\n/).map((block, idx) => {
                                    // Bullet points
                                    if (/^[-*•]\s+/.test(block.trim())) {
                                      return (
                                        <ul key={idx} style={{ marginLeft: 20 }}>
                                          {block.split(/\n|\r/).map((line, i) =>
                                            /^[-*•]\s+/.test(line.trim()) ? (
                                              <li key={i}>{line.replace(/^[-*•]\s+/, '')}</li>
                                            ) : null
                                          )}
                                        </ul>
                                      );
                                    }
                                    // Section headers
                                    if (/^#+\s*/.test(block.trim())) {
                                      return <h4 key={idx}>{block.replace(/^#+\s*/, '')}</h4>;
                                    }
                                    // Paragraphs
                                    return <p key={idx}>{block}</p>;
                                  })
                                ) : (
                                  <pre>{JSON.stringify(qa.answer, null, 2)}</pre>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Highlight Menu */}
        {showHighlightMenu && (
          <div 
            className="highlight-menu"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`
            }}
          >
            <button onClick={() => addHighlight('#ffeb3b')} className="highlight-option yellow">Yellow</button>
            <button onClick={() => addHighlight('#4caf50')} className="highlight-option green">Green</button>
            <button onClick={() => addHighlight('#2196f3')} className="highlight-option blue">Blue</button>
            <button onClick={() => addHighlight('#ff9800')} className="highlight-option orange">Orange</button>
          </div>
        )}

        {/* Note Info Footer */}
        <div className="note-info-footer">
          <div className="file-info">
            <span>📎 Original file: {note.originalFileName}</span>
          </div>
          <div className="timestamps">
            <span>📅 Created: {formatDate(note.createdAt)}</span>
            {note.updatedAt !== note.createdAt && (
              <span>🔄 Updated: {formatDate(note.updatedAt)}</span>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NoteDetailPage;