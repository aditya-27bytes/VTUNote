import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import apiClient from '../utils/apiClient';

interface TeacherItem { _id: string; name: string; email: string; department?: string; designation?: string }

export default function StudentConnectionsPage() {
  const [teacherId, setTeacherId] = useState('');
  const [connections, setConnections] = useState<any[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [connectionsRes, teachersRes] = await Promise.all([
        apiClient.get('/connections/me'),
        apiClient.get('/connections/teachers')
      ]);
      setConnections(connectionsRes.data);
      setAvailableTeachers(teachersRes.data.teachers || teachersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setConnections([]);
      setAvailableTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const connect = async () => {
    if (!teacherId.trim()) { 
      alert('Please enter a teacher ID'); 
      return; 
    }
    try {
      const response = await apiClient.post('/connections/connect', { teacherId: teacherId.trim() });
      if (response.data.success) {
        alert(response.data.message || 'Connection request sent successfully!');
        setTeacherId('');
        await load();
      } else {
        alert(response.data.message || 'Failed to send connection request');
      }
    } catch (error: any) {
      console.error('Error connecting to teacher:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to connect to teacher. Please check the teacher ID and try again.';
      alert(errorMessage);
    }
  };

  return (
    <Layout>
      <div className="page" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1>My Teachers</h1>
        
        {/* Connect to Teacher Section */}
        <div style={{ marginBottom: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
          <h3>Connect to a Teacher</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input 
              className="form-input" 
              placeholder="Enter Teacher ID to connect" 
              value={teacherId} 
              onChange={(e) => setTeacherId(e.target.value)} 
            />
            <button className="submit-btn" onClick={connect}>Connect</button>
          </div>
          
          {/* Available Teachers List */}
          {availableTeachers.length > 0 && (
            <div>
              <h4>Available Teachers:</h4>
              <div style={{ display: 'grid', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {availableTeachers.map((teacher) => (
                  <div key={teacher._id} style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: 4, 
                    padding: 8, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div>
                      <strong>{teacher.name}</strong> ({teacher.email})
                      <br />
                      <small>{teacher.designation} • {teacher.department}</small>
                      {teacher.connectionStatus && (
                        <>
                          <br />
                          <small style={{color: teacher.connectionStatus === 'approved' ? 'green' : teacher.connectionStatus === 'pending' ? 'orange' : 'red'}}>
                            Status: {teacher.connectionStatus}
                          </small>
                        </>
                      )}
                    </div>
                    <button 
                      onClick={() => setTeacherId(teacher._id)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      disabled={teacher.connectionStatus === 'pending' || teacher.connectionStatus === 'approved'}
                    >
                      {teacher.connectionStatus === 'approved' ? 'Connected' : 
                       teacher.connectionStatus === 'pending' ? 'Pending' : 'Use ID'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Connected Teachers */}
        <div>
          <h3>Connected Teachers</h3>
          {loading ? <p>Loading...</p> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {connections.map((c, i) => (
                <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                  <div><strong>{(c.teacher as TeacherItem)?.name}</strong> ({(c.teacher as TeacherItem)?.email})</div>
                  <div>{(c.teacher as TeacherItem)?.designation} • {(c.teacher as TeacherItem)?.department}</div>
                </div>
              ))}
              {connections.length === 0 && <p>No teachers connected yet.</p>}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}


