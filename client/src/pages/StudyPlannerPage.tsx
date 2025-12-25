import React, { useEffect, useState } from 'react';
import apiClient from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';

type Plan = {
  _id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  notified?: boolean;
};

export default function StudyPlannerPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/study-planner');
      setPlans(res.data.plans || []);
    } catch (err) {
      console.error('Failed to fetch plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!title || !scheduledAt) return alert('Title and scheduled time required');
      await apiClient.post('/study-planner', { title, description, scheduledAt });
      setTitle(''); setDescription(''); setScheduledAt('');
      fetchPlans();
      alert('Plan created — you will receive an email at the scheduled time');
    } catch (err) {
      console.error(err);
      alert('Failed to create plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await apiClient.delete(`/study-planner/${id}`);
      fetchPlans();
    } catch (err) {
      console.error(err);
      alert('Failed to delete plan');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Study Planner</h2>
      <p>Logged in as: {user?.email}</p>

      <form onSubmit={handleCreate} style={{ marginBottom: 20 }}>
        <div>
          <label>Title</label><br />
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label>Description (optional)</label><br />
          <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label>Scheduled at</label><br />
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ padding: 8 }} />
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="submit">Create Plan</button>
        </div>
      </form>

      <h3>Your Plans</h3>
      {loading ? <div>Loading...</div> : (
        <div>
          {plans.length === 0 && <div>No plans yet</div>}
          {plans.map(p => (
            <div key={p._id} style={{ border: '1px solid #eee', padding: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{p.title}</strong>
                  <div style={{ color: '#666' }}>{p.description}</div>
                  <div style={{ color: '#333' }}>Scheduled: {new Date(p.scheduledAt).toLocaleString()}</div>
                </div>
                <div>
                  <div>{p.notified ? 'Notified' : 'Pending'}</div>
                  <button onClick={() => handleDelete(p._id)} style={{ marginTop: 8 }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
