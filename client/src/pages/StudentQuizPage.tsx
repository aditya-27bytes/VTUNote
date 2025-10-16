import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import '../styles/StudentQuizPage.css';

interface QuizQuestion {
  _id: string;
  question: string;
  options?: string[];
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
}

export default function StudentQuizPage() {
  const { user: _user } = useAuth();
  const [params] = useSearchParams();
  const [noteId, setNoteId] = useState<string>('');
  const [myNotes, setMyNotes] = useState<Array<{ _id: string; title: string; module: string; subject: string; flashcards?: any[] }>>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; correctCount: number; total: number } | null>(null);

  const canSubmit = useMemo(() => {
    if (!activeQuiz) return false;
    return activeQuiz.questions.every(q => answers[q._id] !== undefined);
  }, [answers, activeQuiz]);

  useEffect(() => {
    setResult(null);
  }, [activeQuiz]);

  useEffect(() => {
    const id = params.get('noteId') || '';
    if (id) setNoteId(id);
  }, [params]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const res = await apiClient.get('/notes');
        const notes = (res.data.notes || []).filter((n: any) => n.flashcards && n.flashcards.length > 0);
        setMyNotes(notes);
      } catch (e) {
        // ignore
      }
    };
    loadNotes();
  }, []);

  const generateQuickQuiz = async () => {
    if (!noteId) {
      setError('Please select a note to generate quiz from');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setActiveQuiz(null);
      setAnswers({});
      setResult(null);

      console.log('Generating quiz for note:', noteId);
      const { data } = await apiClient.post('/quizzes/generate-self', {
        noteId,
        numQuestions: 8
      });

      if (!data._id || !Array.isArray(data.questions)) {
        throw new Error('Invalid quiz data received from server');
      }

      console.log('Quiz generated successfully:', {
        id: data._id,
        questionCount: data.questions.length
      });

      setActiveQuiz(data);
    } catch (err: any) {
      console.error('Failed to generate quiz:', err);
      const errorMessage = err?.response?.data?.message 
        || err?.message 
        || 'Failed to generate quiz. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const submitAttempt = async () => {
    if (!activeQuiz) return;
    try {
      setSubmitting(true);
      const payload = {
        answers: activeQuiz.questions.map(q => ({ questionId: q._id, givenAnswer: answers[q._id] || '' }))
      };
      console.log('Submitting answers:', payload);
      const { data } = await apiClient.post(`/quizzes/${activeQuiz._id}/attempts`, payload);
      console.log('Received response:', data);
      if (data.success && data.attempt) {
        setResult({
          score: data.attempt.score,
          correctCount: data.attempt.correctCount,
          total: data.attempt.totalQuestions
        });
        console.log('Set result:', {
          score: data.attempt.score,
          correctCount: data.attempt.correctCount,
          total: data.attempt.totalQuestions
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Submit attempt failed', err);
      alert('Submit attempt failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="quiz-container">
        <div className="quick-quiz-section">
          <h2>Quick Quiz</h2>
          <div className="quiz-selection">
            <select
              className="form-input"
              value={noteId}
              onChange={(e) => {
                setNoteId(e.target.value);
                setError(null);
              }}
              aria-label="Select note for quiz"
              title="Select note for quiz"
              disabled={loading}
            >
              <option value="">Select a note with flashcards</option>
              {myNotes.map(n => (
                <option key={n._id} value={n._id}>{n.title} • {n.module} • {n.subject}</option>
              ))}
            </select>
            <button 
              className={`generate-button ${loading ? 'loading' : ''}`}
              onClick={generateQuickQuiz}
              disabled={!noteId || loading}
            >
              {loading ? 'Generating...' : activeQuiz ? 'Generate New Quiz' : 'Generate Quiz'}
            </button>
          </div>
          {error && (
            <div className="error-message" role="alert">
              ❌ {error}
            </div>
          )}
          
          {myNotes.length > 0 && (
            <div className="quiz-tip">
              <span>💡</span>
              <span>Tip: You can also start from the Notes page using the Start Quiz button.</span>
            </div>
          )}
        </div>

        {!activeQuiz ? (
          <p className="empty-state">Generate a quiz from any note that has flashcards to start practicing.</p>
        ) : (
          <div className="quiz-content">
            <h2 className="quiz-title">{activeQuiz.title}</h2>
            {activeQuiz.questions.map((q, idx) => (
              <div key={q._id} className="question-card">
                <div className="question-text">{idx + 1}. {q.question}</div>
                {q.options && q.options.length > 0 ? (
                  <div className="options-grid">
                    {q.options.map((opt, i) => (
                      <label key={i} className="option-label">
                        <input
                          type="radio"
                          name={q._id}
                          value={opt}
                          checked={answers[q._id] === opt}
                          onChange={() => setAnswers(prev => ({ ...prev, [q._id]: opt }))}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    className="answer-input"
                    placeholder="Your answer"
                    value={answers[q._id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q._id]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            <div className="quiz-actions">
              <button 
                className="submit-button"
                disabled={!canSubmit || submitting} 
                onClick={submitAttempt}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="result-card">
            <h3>Quiz Results</h3>
            <div className="result-stats">
              <div className="stat-item">
                <span className="stat-label">Score</span>
                <span className="stat-value">{result.score}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Correct Answers</span>
                <span className="stat-value">{result.correctCount} / {result.total}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


