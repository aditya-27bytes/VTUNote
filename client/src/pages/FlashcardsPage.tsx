import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

interface Flashcard {
  question: string;
  answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

interface Note {
  _id: string;
  title: string;
  module: string;
  subject: string;
  flashcards: Flashcard[];
}

interface StudySession {
  noteId: string;
  currentIndex: number;
  showAnswer: boolean;
  correctAnswers: number;
  totalAnswered: number;
  startTime: Date;
  sessionId?: string;
}

const FlashcardsPage: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [filters, setFilters] = useState({
    subject: '',
    module: '',
    difficulty: ''
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    fetchNotesWithFlashcards();
  }, []);

  // Timer effect for study session
  useEffect(() => {
    let interval: number;
    if (studySession) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = now.getTime() - studySession.startTime.getTime();
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [studySession]);

  const fetchNotesWithFlashcards = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/notes', {
        params: {
          semester: user?.semester,
          branch: user?.branch
        }
      });
      
      // Filter notes that have flashcards
      const notesWithFlashcards = response.data.notes.filter(
        (note: Note) => note.flashcards && note.flashcards.length > 0
      );
      
      setNotes(notesWithFlashcards);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const startStudySession = async (note: Note) => {
    let flashcards = [...note.flashcards];
    
    // Apply difficulty filter
    if (filters.difficulty) {
      flashcards = flashcards.filter(card => card.difficulty === filters.difficulty);
    }
    
    if (flashcards.length === 0) {
      alert('No flashcards match your selected filters');
      return;
    }
    
    // Shuffle flashcards
    flashcards = flashcards.sort(() => Math.random() - 0.5);
    
    setSelectedNote({ ...note, flashcards });
    const startTime = new Date();
    let sessionId = '';
    try {
      const { data } = await apiClient.post('/flashcards/sessions', { noteId: note._id });
      sessionId = data.sessionId;
      (window as any).currentFlashSessionId = sessionId;
    } catch (e) {
      console.error('Failed to start session', e);
    }
    setStudySession({
      noteId: note._id,
      currentIndex: 0,
      showAnswer: false,
      correctAnswers: 0,
      totalAnswered: 0,
      startTime: startTime,
      sessionId: sessionId
    });
    setElapsedTime(0);
  };

  const nextCard = () => {
    if (!studySession || !selectedNote) return;
    
    if (studySession.currentIndex < selectedNote.flashcards.length - 1) {
      setStudySession(prev => prev ? {
        ...prev,
        currentIndex: prev.currentIndex + 1,
        showAnswer: false
      } : null);
    } else {
      // End of session
      (async () => {
        const duration = new Date().getTime() - studySession.startTime.getTime();
        const accuracy = studySession.totalAnswered > 0 
          ? Math.round((studySession.correctAnswers / studySession.totalAnswered) * 100)
          : 0;
        try {
          await apiClient.post(`/flashcards/sessions/${(window as any).currentFlashSessionId}/complete`, {
            totalCards: selectedNote.flashcards.length,
            correctCount: studySession.correctAnswers,
            duration: duration,
            accuracy: accuracy
          });
        } catch (e) {
          console.error('Failed to complete session', e);
        }
        const minutes = Math.floor(duration / 1000 / 60);
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);
        const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        
        alert(`🎉 Study session completed!\n\n📊 Accuracy: ${accuracy}%\n⏱️ Time: ${timeDisplay}\n📚 Cards studied: ${studySession.totalAnswered}`);
        endStudySession();
      })();
    }
  };

  const markAnswer = (correct: boolean) => {
    if (!studySession) return;
    
    setStudySession(prev => prev ? {
      ...prev,
      correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
      totalAnswered: prev.totalAnswered + 1
    } : null);
  };

  const toggleAnswer = () => {
    setStudySession(prev => prev ? {
      ...prev,
      showAnswer: !prev.showAnswer
    } : null);
  };

  const endStudySession = () => {
    setStudySession(null);
    setSelectedNote(null);
    setElapsedTime(0);
  };

  const filteredNotes = notes.filter(note => {
    if (filters.subject && note.subject !== filters.subject) return false;
    if (filters.module && note.module !== filters.module) return false;
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">Loading flashcards...</div>
      </Layout>
    );
  }

  // Study Session View
  if (studySession && selectedNote) {
    const currentCard = selectedNote.flashcards[studySession.currentIndex];
    const progress = ((studySession.currentIndex + 1) / selectedNote.flashcards.length) * 100;
    
    // Format elapsed time
    const minutes = Math.floor(elapsedTime / 1000 / 60);
    const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
    const timeDisplay = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `0:${seconds.toString().padStart(2, '0')}`;
    
    return (
      <Layout>
        <div className="page flashcards-study">
          <div className="study-header">
            <button onClick={endStudySession} className="end-session-btn">
              ← End Session
            </button>
            <div className="study-info">
              <h3>{selectedNote.title}</h3>
              <div className="progress-info">
                Card {studySession.currentIndex + 1} of {selectedNote.flashcards.length}
              </div>
            </div>
            <div className="session-stats">
              <span>⏱️ {timeDisplay}</span>
              <span>✅ {studySession.correctAnswers}/{studySession.totalAnswered}</span>
            </div>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="flashcard-container" style={{ 
            maxWidth: '500px', 
            margin: '0 auto', 
            width: '100%', 
            height: '400px',
            perspective: '1000px',
            display: 'block', /* Ensure visibility */
            position: 'relative'
          }}>
            <div className="flashcard" style={{ 
              position: 'absolute', 
              width: '100%', 
              height: '100%', 
              transformStyle: 'preserve-3d',
              transition: 'transform 0.8s ease-in-out',
              transform: studySession.showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)',
              display: 'block', /* Ensure visibility */
              top: 0,
              left: 0
            }}>
              <div style={{ 
                position: 'absolute',
                width: '100%', 
                height: '100%',
                backfaceVisibility: 'hidden',
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                <div className="difficulty-badge" style={{ alignSelf: 'flex-start', marginBottom: '10px' }}>
                  <span className={`difficulty ${currentCard.difficulty}`} style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    backgroundColor: currentCard.difficulty === 'easy' ? '#2ecc71' : 
                                    currentCard.difficulty === 'medium' ? '#f39c12' : '#e74c3c',
                    color: 'white'
                  }}>
                    {currentCard.difficulty.toUpperCase()}
                  </span>
                </div>
                <div className="card-content" style={{ 
                  textAlign: 'center', 
                  width: '100%', 
                  padding: '10px 0', 
                  flex: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <h4 style={{ marginBottom: '15px', fontSize: '18px' }}>Question</h4>
                  <p style={{ margin: '0 auto', maxWidth: '90%', lineHeight: '1.5' }}>{currentCard.question}</p>
                </div>
                <button onClick={toggleAnswer} className="reveal-btn" style={{ 
                  marginTop: '20px', 
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  backgroundColor: '#4a90e2', 
                  color: 'white', 
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}>
                  🔍 Show Answer
                </button>
              </div>

              <div style={{ 
                position: 'absolute',
                width: '100%', 
                height: '100%',
                backfaceVisibility: 'hidden',
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: 'rotateY(180deg)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                <div className="card-content" style={{ 
                  textAlign: 'center', 
                  width: '100%', 
                  padding: '10px 0', 
                  flex: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <h4 style={{ marginBottom: '15px', fontSize: '18px' }}>Answer</h4>
                  <p style={{ margin: '0 auto', maxWidth: '90%', lineHeight: '1.5' }}>{currentCard.answer}</p>
                  
                  {currentCard.explanation && (
                    <div className="explanation" style={{ 
                      position: 'absolute',
                      width: '250px',
                      right: '-270px',
                      top: '0',
                      padding: '15px', 
                      backgroundColor: 'rgba(247, 247, 247, 0.9)',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #e0e0e0',
                      zIndex: 10
                    }}>
                      <h5 style={{ 
                        textAlign: 'center', 
                        marginBottom: '10px', 
                        fontSize: '16px',
                        color: '#555'
                      }}>💡 Explanation</h5>
                      <p style={{ 
                        textAlign: 'center', 
                        maxWidth: '90%', 
                        margin: '0 auto', 
                        lineHeight: '1.5',
                        padding: '0 15px 10px'
                      }}>{currentCard.explanation}</p>
                    </div>
                  )}
                </div>
                
                <div className="answer-actions" style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '10px', 
                  marginTop: '20px', 
                  width: '100%', 
                  maxWidth: '300px', 
                  margin: '20px auto 0'
                }}>
                  <button 
                    onClick={() => { markAnswer(false); nextCard(); }} 
                    style={{ 
                      flex: '1', 
                      maxWidth: '140px', 
                      padding: '10px 15px', 
                      borderRadius: '6px', 
                      border: 'none', 
                      backgroundColor: '#e74c3c', 
                      color: 'white', 
                      cursor: 'pointer' 
                    }}
                  >
                    ✗ Incorrect
                  </button>
                  <button 
                    onClick={() => { markAnswer(true); nextCard(); }} 
                    style={{ 
                      flex: '1', 
                      maxWidth: '140px', 
                      padding: '10px 15px', 
                      borderRadius: '6px', 
                      border: 'none', 
                      backgroundColor: '#2ecc71', 
                      color: 'white', 
                      cursor: 'pointer' 
                    }}
                  >
                    ✓ Correct
                  </button>
                </div>
              </div>
            </div>
          </div>

          {studySession.showAnswer && (
            <div className="answer-actions" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', width: '100%', maxWidth: '500px', margin: '20px auto 0' }}>
              <button onClick={() => { markAnswer(false); nextCard(); }} className="wrong-btn" style={{ flex: '1', maxWidth: '180px', padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#dc3545', color: 'white', cursor: 'pointer' }}>
                ❌ Incorrect
              </button>
              <button onClick={() => { markAnswer(true); nextCard(); }} className="correct-btn" style={{ flex: '1', maxWidth: '180px', padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#28a745', color: 'white', cursor: 'pointer' }}>
                ✅ Correct
              </button>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Main Flashcards View
  return (
    <Layout>
      <div className="page">
        <div className="flashcards-header">
          <h2>🎯 Flashcards Study</h2>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="settings-btn"
          >
            ⚙️ Settings
          </button>
        </div>

        {showSettings && (
          <div className="filters-panel">
            <h4>Study Preferences</h4>
            <div className="filter-controls">
              <select 
                value={filters.subject} 
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                aria-label="Filter by subject"
              >
                <option value="">All Subjects</option>
                {[...new Set(notes.map(note => note.subject))].map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              <select 
                value={filters.module} 
                onChange={(e) => setFilters(prev => ({ ...prev, module: e.target.value }))}
                aria-label="Filter by module"
              >
                <option value="">All Modules</option>
                {[...new Set(notes.map(note => note.module))].map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>

              <select 
                value={filters.difficulty} 
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                aria-label="Filter by difficulty"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        )}

        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <h3>🎴 No flashcards available</h3>
            <p>
              {notes.length === 0 
                ? "You haven't created any notes with flashcards yet."
                : "No notes match your current filters."
              }
            </p>
            <a href="/upload" className="btn-primary">Upload PDF to Generate Flashcards</a>
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => {
              const totalCards = note.flashcards.length;
              const filteredCards = filters.difficulty 
                ? note.flashcards.filter(card => card.difficulty === filters.difficulty).length
                : totalCards;
              
              const difficultyBreakdown = {
                easy: note.flashcards.filter(card => card.difficulty === 'easy').length,
                medium: note.flashcards.filter(card => card.difficulty === 'medium').length,
                hard: note.flashcards.filter(card => card.difficulty === 'hard').length
              };

              return (
                <div key={note._id} className="flashcard-note-card">
                  <div className="note-header">
                    <h3>{note.title}</h3>
                    <div className="note-meta">
                      <span className="module-badge">{note.module}</span>
                      <span className="subject-badge">{note.subject}</span>
                    </div>
                  </div>

                  <div className="flashcard-stats">
                    <div className="total-cards">
                      <span className="count">{filteredCards}</span>
                      <span className="label">cards available</span>
                    </div>
                    
                    <div className="difficulty-breakdown">
                      <span className="difficulty easy">Easy: {difficultyBreakdown.easy}</span>
                      <span className="difficulty medium">Medium: {difficultyBreakdown.medium}</span>
                      <span className="difficulty hard">Hard: {difficultyBreakdown.hard}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => startStudySession(note)}
                    className="start-study-btn"
                    disabled={filteredCards === 0}
                  >
                    🚀 Start Study Session
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FlashcardsPage;