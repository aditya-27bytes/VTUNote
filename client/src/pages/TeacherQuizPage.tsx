import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useTeacherAuth } from '../contexts/TeacherAuthContext';
import apiClient from '../utils/apiClient';

interface QuizQuestionDraft {
  question: string;
  correctAnswer: string;
  options: string[];
  explanation?: string;
}

export default function TeacherQuizPage() {
  useTeacherAuth();
  const [title, setTitle] = useState('');
  const [noteId, setNoteId] = useState('');
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([
    { question: '', correctAnswer: '', options: ['', '', '', ''], explanation: '' }
  ]);
  const [stats, setStats] = useState<any>(null);

  const addQuestion = () => setQuestions(prev => [...prev, { question: '', correctAnswer: '', options: ['', '', '', ''], explanation: '' }]);

  const updateOption = (questionIdx: number, optionIdx: number, newValue: string) => {
    console.log(`Updating option ${optionIdx} in question ${questionIdx} to:`, newValue);
    setQuestions(prevQuestions => {
      const newQuestions = [...prevQuestions];
      const currentQuestion = { ...newQuestions[questionIdx] };
      const oldOption = currentQuestion.options[optionIdx];
      
      // Update the options array
      currentQuestion.options = [...currentQuestion.options];
      currentQuestion.options[optionIdx] = newValue;
      
      // If the old option was the correct answer, update it to the new value
      if (currentQuestion.correctAnswer === oldOption) {
        currentQuestion.correctAnswer = newValue;
      }
      
      newQuestions[questionIdx] = currentQuestion;
      return newQuestions;
    });
  };

  const removeOption = (questionIdx: number, optionIdx: number) => {
    setQuestions(prev => prev.map((q, qIdx) => {
      if (qIdx === questionIdx && q.options.length > 2) {
        const newOptions = q.options.filter((_, oIdx) => oIdx !== optionIdx);
        // If the removed option was the correct answer, clear the correct answer
        const newCorrectAnswer = q.correctAnswer === q.options[optionIdx] ? '' : q.correctAnswer;
        return { ...q, options: newOptions, correctAnswer: newCorrectAnswer };
      }
      return q;
    }));
  };

  const createQuiz = async () => {
    try {
      // Only send noteId if it looks like a valid ObjectId
      const payload: any = {
        title,
        questions: questions.filter(q => q.question && q.correctAnswer && q.options.filter(opt => opt.trim()).length >= 2)
      };
      if (/^[a-fA-F0-9]{24}$/.test(noteId)) {
        payload.noteId = noteId;
      }
      await apiClient.post('/quizzes', payload);
      alert('Quiz created');
      setTitle('');
      setNoteId('');
      setQuestions([{ question: '', correctAnswer: '', options: ['', '', '', ''], explanation: '' }]);
      void fetchStats();
    } catch (err: any) {
      console.error('Create quiz failed', err);
      const msg = err?.response?.data?.message || err?.message || 'Create quiz failed';
      alert(msg);
    }
  };

  const generateFromNote = async () => {
    if (!noteId) { alert('Enter note id'); return; }
    try {
      await apiClient.post('/quizzes/generate', { noteId, numQuestions: 10 });
      alert('Generated from note flashcards');
      setNoteId('');
      void fetchStats();
    } catch (err) {
      console.error('Generate failed', err);
      alert('Generate failed');
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await apiClient.get('/quizzes/teacher/stats/overview');
      setStats(data);
    } catch (err) {
      console.error('Stats load failed', err);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <Layout>
      <div className="page" style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: window.innerWidth >= 768 ? '24px' : '16px'
      }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', 
            fontWeight: '700', 
            color: '#111827', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1.2'
          }}>
            Teacher Quiz Management
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
            padding: '0 16px'
          }}>
            Create, manage, and track quiz performance
          </p>
        </div>
        
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr', maxWidth: '100%' }}>
          <div style={{ 
            background: '#ffffff',
            border: '1px solid #e5e7eb', 
            borderRadius: 16, 
            padding: 24,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📝</span>
              Create New Quiz
            </h3>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              style={{ backgroundColor: '#ffffff', color: '#111827', caretColor: '#111827' }}
            />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Optional Note ID" 
              value={noteId} 
              onChange={(e) => setNoteId(e.target.value)}
              style={{ backgroundColor: '#ffffff', color: '#111827', caretColor: '#111827' }}
            />
            {questions.map((q, idx) => (
              <div key={idx} style={{ 
                border: '2px dashed #e5e7eb', 
                padding: 20, 
                borderRadius: 12, 
                marginTop: 16,
                backgroundColor: '#f8fafc',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '6px', 
                    display: 'block' 
                  }}>
                    Question {idx + 1}:
                  </label>
                  <input 
                    type="text"
                    className="form-input" 
                    placeholder={`Enter your question here...`} 
                    value={q.question} 
                    onChange={(e) => setQuestions(prev => prev.map((x, i) => i === idx ? { ...x, question: e.target.value } : x))}
                    style={{ 
                      backgroundColor: '#ffffff', 
                      color: '#111827', 
                      caretColor: '#111827', 
                      fontSize: '15px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
                
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '8px', display: 'block' }}>MCQ Options:</label>
                  {q.options.map((option, optIdx) => (
                    <div key={optIdx} style={{ 
                      marginBottom: 8, 
                      display: 'flex',
                      alignItems: 'center',
                      gap: window.innerWidth >= 768 ? '8px' : '6px',
                      padding: window.innerWidth >= 768 ? '8px' : '6px',
                      borderRadius: '8px',
                      backgroundColor: q.correctAnswer === option && option.trim() !== '' ? '#f0fdf4' : '#f8fafc',
                      border: q.correctAnswer === option && option.trim() !== '' ? '2px solid #22c55e' : '1px solid #e5e7eb',
                      transition: 'all 0.2s ease',
                      flexWrap: window.innerWidth < 480 ? 'wrap' : 'nowrap'
                    }}>
                      <span style={{ 
                        minWidth: '24px', 
                        fontSize: '14px',
                        fontWeight: '600',
                        color: q.correctAnswer === option && option.trim() !== '' ? '#22c55e' : '#6b7280',
                        textAlign: 'center',
                        flexShrink: 0
                      }}>
                        {String.fromCharCode(65 + optIdx)}
                        {q.correctAnswer === option && option.trim() !== '' && ' ✓'}
                      </span>
                      <input 
                        type="text"
                        className="form-input" 
                        placeholder={`Enter option ${String.fromCharCode(65 + optIdx)}`}
                        value={option}
                        onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                        style={{ 
                          flex: 1,
                          minWidth: 0,
                          marginBottom: 0,
                          padding: '8px 12px',
                          borderColor: q.correctAnswer === option && option.trim() !== '' ? '#22c55e' : '#d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px',
                          fontWeight: '400',
                          caretColor: '#111827',
                          borderRadius: '6px'
                        }}
                      />
                      <input
                        type="radio"
                        name={`correct-${idx}`}
                        checked={q.correctAnswer === option && option.trim() !== ''}
                        onChange={() => {
                          if (option.trim() !== '') {
                            setQuestions(prev => prev.map((x, i) => i === idx ? { ...x, correctAnswer: option } : x));
                          }
                        }}
                        disabled={option.trim() === ''}
                        title={option.trim() === '' ? 'Enter option text first' : 'Mark as correct answer'}
                        style={{ 
                          cursor: option.trim() === '' ? 'not-allowed' : 'pointer',
                          width: '18px',
                          height: '18px',
                          accentColor: '#22c55e',
                          flexShrink: 0
                        }}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx, optIdx)}
                          style={{
                            padding: '4px',
                            fontSize: '12px',
                            background: '#fee2e2',
                            border: '1px solid #fca5a5',
                            borderRadius: '4px',
                            color: '#dc2626',
                            cursor: 'pointer',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                          }}
                          title="Remove this option"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fecaca';
                            e.currentTarget.style.borderColor = '#f87171';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                            e.currentTarget.style.borderColor = '#fca5a5';
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '6px', 
                    display: 'block' 
                  }}>
                    Explanation (Optional):
                  </label>
                  <input 
                    type="text"
                    className="form-input" 
                    placeholder="Provide an explanation for the correct answer..." 
                    value={q.explanation || ''} 
                    onChange={(e) => setQuestions(prev => prev.map((x, i) => i === idx ? { ...x, explanation: e.target.value } : x))}
                    style={{ 
                      backgroundColor: '#ffffff', 
                      color: '#111827', 
                      caretColor: '#111827',
                      fontSize: '14px',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    onClick={() => setQuestions(prev => prev.map((x, i) => 
                      i === idx ? { ...x, options: [...x.options, ''] } : x
                    ))}
                    disabled={q.options.length >= 6}
                    style={{ 
                      padding: '8px 16px', 
                      fontSize: '14px', 
                      background: q.options.length >= 6 ? '#f3f4f6' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                      border: 'none', 
                      borderRadius: '6px',
                      cursor: q.options.length >= 6 ? 'not-allowed' : 'pointer',
                      opacity: q.options.length >= 6 ? 0.6 : 1,
                      color: q.options.length >= 6 ? '#6b7280' : '#ffffff',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    title={q.options.length >= 6 ? 'Maximum 6 options allowed' : 'Add another option'}
                  >
                    + Add Option
                  </button>
                  {questions.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => setQuestions(prev => prev.filter((_, i) => i !== idx))}
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '14px', 
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                        border: 'none', 
                        borderRadius: '6px', 
                        color: '#ffffff',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🗑️ Remove Question
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div style={{ 
              display: 'flex', 
              gap: window.innerWidth >= 768 ? 16 : 12, 
              marginTop: 24, 
              flexWrap: 'wrap', 
              justifyContent: 'center',
              flexDirection: window.innerWidth < 480 ? 'column' : 'row'
            }}>
              <button 
                onClick={addQuestion}
                style={{
                  padding: window.innerWidth >= 768 ? '12px 24px' : '10px 20px',
                  fontSize: window.innerWidth >= 768 ? '16px' : '14px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: window.innerWidth >= 768 ? '140px' : '100%',
                  flex: window.innerWidth < 480 ? '1' : 'none'
                }}
              >
                ➕ Add Question
              </button>
              <button 
                onClick={createQuiz}
                style={{
                  padding: window.innerWidth >= 768 ? '12px 24px' : '10px 20px',
                  fontSize: window.innerWidth >= 768 ? '16px' : '14px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: window.innerWidth >= 768 ? '140px' : '100%',
                  flex: window.innerWidth < 480 ? '1' : 'none'
                }}
              >
                🚀 Create Quiz
              </button>
            </div>
          </div>

          <div style={{ 
            background: '#ffffff',
            border: '1px solid #e5e7eb', 
            borderRadius: 16, 
            padding: 24,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🤖</span>
              Generate from Note Flashcards
            </h3>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Note ID to generate quiz from flashcards" 
              value={noteId} 
              onChange={(e) => setNoteId(e.target.value)}
              style={{ 
                backgroundColor: '#ffffff', 
                color: '#111827', 
                caretColor: '#111827',
                marginBottom: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db'
              }}
            />
            <button 
              onClick={generateFromNote}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%'
              }}
            >
              ⚡ Generate Quiz
            </button>
          </div>

          <div style={{ 
            background: '#ffffff',
            border: '1px solid #e5e7eb', 
            borderRadius: 16, 
            padding: 24,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              Performance Overview
            </h3>
            {stats ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <p><strong>Total Attempts:</strong> {stats.totals?.attempts || 0}</p>
                    <p><strong>Average Score:</strong> {Math.round(stats.totals?.avgScore || 0)}%</p>
                  </div>
                  <div>
                    <p style={{ color: stats.totals?.avgScore >= 70 ? '#4caf50' : '#f44336' }}>
                      <strong>Performance:</strong> {stats.totals?.avgScore >= 70 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </div>
                </div>

                {Array.isArray(stats.overTime) && stats.overTime.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h4>Activity (Last 14 days)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4, alignItems: 'end', height: 120, borderLeft: '1px solid #eee', borderBottom: '1px solid #eee', padding: 8 }}>
                      {stats.overTime.map((d: any, i: number) => (
                        <div key={i} title={`${d._id}: ${d.attempts} attempts`} style={{ background: '#7c3aed', height: Math.max(6, d.attempts * 10) }} />
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <h4>Quiz Performance</h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {stats.perQuiz?.map((q: any, i: number) => (
                      <div key={i} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '2fr 1fr 1fr', 
                        gap: 8, 
                        padding: 8, 
                        border: '1px solid #eee', 
                        borderRadius: 4,
                        backgroundColor: q.avgScore >= 70 ? '#f1f8e9' : '#ffebee'
                      }}>
                        <span>Quiz {i + 1}</span>
                        <span>Attempts: {q.attempts}</span>
                        <span style={{ color: q.avgScore >= 70 ? '#4caf50' : '#f44336' }}>
                          Avg: {Math.round(q.avgScore)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {Array.isArray(stats.wrongAnswers) && stats.wrongAnswers.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h4>Most Challenging Questions</h4>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {stats.wrongAnswers.slice(0, 5).map((wa: any, i: number) => (
                        <div key={i} style={{ 
                          padding: 12, 
                          border: '1px solid #ffcdd2', 
                          borderRadius: 6,
                          backgroundColor: '#ffebee'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                            {wa.quizTitle}
                          </div>
                          <div style={{ fontSize: '14px', marginBottom: 4 }}>
                            {wa._id.question || 'Question text not available'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#f44336' }}>
                            Wrong answers: {wa.wrongCount} times
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>Loading stats...</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}


