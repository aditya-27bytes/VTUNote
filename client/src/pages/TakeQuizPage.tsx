import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import apiClient from '../utils/apiClient';

export default function TakeQuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get(`/quizzes/${id}`);
        setQuiz(data);
      } catch (err) {
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const canSubmit = quiz && quiz.questions && quiz.questions.every((q: any) => {
    const answer = answers[q._id];
    return answer !== undefined && answer !== null && String(answer).trim() !== '';
  });

  const submitQuiz = async () => {
    if (!quiz) return;
    try {
      setSubmitting(true);
      const payload = {
        answers: quiz.questions.map((q: any) => ({ questionId: q._id, givenAnswer: answers[q._id] || '' }))
      };
      const { data } = await apiClient.post(`/quizzes/${quiz._id}/attempts`, payload);
      if (data.success && data.attempt) {
        setResult(data.attempt);
      } else {
        setError('Failed to submit quiz');
      }
    } catch (err) {
      setError('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="quiz-container">
        <h1>Take Quiz</h1>
        {loading ? <p>Loading...</p> : error ? <p>{error}</p> : quiz ? (
          <div>
            <h2>{quiz.title}</h2>
            <div>{quiz.description}</div>
            {quiz.questions && quiz.questions.map((q: any, idx: number) => (
              <div key={q._id} className="quiz-question" style={{ 
                marginBottom: '32px',
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="quiz-question-text" style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '16px',
                  lineHeight: 1.5
                }}>Q{idx + 1}: {q.question}</div>
                {q.options && q.options.length > 0 ? (
                  <div className="quiz-options">
                    {q.options.map((opt: string, i: number) => {
                      const optionKey = `${q._id}-${i}`;
                      const isSelected = answers[q._id] === opt;
                      const isHovered = hoveredOption === optionKey;
                      
                      return (
                        <div 
                          key={i} 
                          onClick={() => setAnswers(prev => ({ ...prev, [q._id]: opt }))}
                          onMouseEnter={() => setHoveredOption(optionKey)}
                          onMouseLeave={() => setHoveredOption(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '16px',
                            margin: '8px 0',
                            border: `2px solid ${isSelected ? '#7c3aed' : isHovered ? '#c7d2fe' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#f0f8ff' : isHovered ? '#f8fafc' : '#ffffff',
                            transition: 'all 0.2s ease',
                            width: '100%',
                            boxSizing: 'border-box',
                            minHeight: '56px',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                        >
                          <input
                            type="radio"
                            name={`question_${q._id}`}
                            value={opt}
                            checked={answers[q._id] === opt}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [q._id]: e.target.value }))}
                            style={{ 
                              marginRight: '12px',
                              flexShrink: 0,
                              width: '16px',
                              height: '16px'
                            }}
                          />
                          <span style={{ 
                            fontWeight: 600, 
                            minWidth: '20px', 
                            color: '#374151',
                            fontSize: '14px',
                            marginRight: '12px',
                            fontFamily: 'inherit'
                          }}>
                            {String.fromCharCode(65 + i)}.
                          </span>
                          <div style={{ 
                            color: '#111827', 
                            fontSize: '15px', 
                            fontWeight: 400,
                            lineHeight: '1.5',
                            flex: 1,
                            fontFamily: 'inherit',
                            textAlign: 'left'
                          }}>
                            {opt}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    placeholder="Type your answer here..."
                    value={answers[q._id] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q._id]: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      color: '#000',
                      backgroundColor: '#fff',
                      border: '2px solid #ccc',
                      borderRadius: '4px',
                      marginTop: '8px',
                      fontFamily: 'Arial, sans-serif',
                      resize: 'vertical'
                    }}
                  />
                )}
              </div>
            ))}
            <button className="submit-btn" disabled={!canSubmit || submitting} onClick={submitQuiz}>
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
            {result && (
              <div style={{ marginTop: 24, padding: 16, border: '1px solid #7c3aed', borderRadius: 8 }}>
                <h3>Quiz Results</h3>
                <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Score: {result.score}%</div>
                  <div>Correct Answers: {result.correctCount} / {result.totalQuestions}</div>
                  <div style={{ color: result.score >= 70 ? '#4caf50' : '#f44336' }}>{result.feedback}</div>
                </div>
                
                {result.answers && result.answers.length > 0 && (
                  <div>
                    <h4>Answer Review:</h4>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {result.answers.map((answer: any, idx: number) => (
                        <div key={idx} style={{ 
                          padding: 12, 
                          border: `1px solid ${answer.isCorrect ? '#4caf50' : '#f44336'}`,
                          borderRadius: 6,
                          backgroundColor: answer.isCorrect ? '#f1f8e9' : '#ffebee'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                            Q{idx + 1}: {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </div>
                          <div>Your Answer: <strong>{answer.givenAnswer}</strong></div>
                          {!answer.isCorrect && (
                            <div style={{ color: '#4caf50' }}>
                              Correct Answer: <strong>{answer.correctAnswer}</strong>
                            </div>
                          )}
                          {answer.explanation && (
                            <div style={{ marginTop: 8, fontStyle: 'italic', color: '#666' }}>
                              Explanation: {answer.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : <p>Quiz not found.</p>}
      </div>
    </Layout>
  );
}
