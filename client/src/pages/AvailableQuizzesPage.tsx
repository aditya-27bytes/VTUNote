import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import apiClient from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AvailableQuizzesPage() {
  const { user: _user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get('/quizzes');
        setQuizzes(data.quizzes || []);
      } catch (err) {
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Layout>
      <div className="page" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1>Available Quizzes</h1>
        {loading ? <p>Loading...</p> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {quizzes.map((quiz) => (
              <div key={quiz._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{quiz.title}</strong>
                  <div>{quiz.description}</div>
                  <div style={{ fontSize: '0.9em', color: '#888' }}>{quiz.isPublic ? 'Public' : 'Assigned'}</div>
                </div>
                <button className="submit-btn" onClick={() => navigate(`/quiz/${quiz._id}`)}>Start Quiz</button>
              </div>
            ))}
            {quizzes.length === 0 && <p>No quizzes available.</p>}
          </div>
        )}
      </div>
    </Layout>
  );
}
