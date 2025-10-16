import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import apiClient from '../utils/apiClient';
import { useNavigate } from 'react-router-dom';


export default function TeacherConnectionsPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/connections/teacher/students');
      // If response is { success, connections, ... }, use connections
      setConnections(data.connections || []);
    } catch (error) {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Layout>
      <div className="page" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1>Connected Students</h1>
        {loading ? <p>Loading...</p> : (
          <div style={{ display: 'grid', gap: 8 }}>
            {connections.map((c, i) => (
              <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                <div>
                  <div><strong>{c.student?.name}</strong> ({c.student?.email})</div>
                  <div>{c.student?.usn} • {c.student?.branch} • Sem {c.student?.semester}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="action-btn" onClick={() => navigate('/teacher/quizzes')}>Assign Quiz</button>
                </div>
              </div>
            ))}
            {connections.length === 0 && <p>No students connected yet.</p>}
          </div>
        )}
      </div>
    </Layout>
  );
}


