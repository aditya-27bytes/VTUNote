import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import Layout from '../components/Layout';
import '../styles/TeacherNoteDetail.css';

interface Note {
  _id: string;
  title: string;
  content?: string;
  subject: string;
  module: string;
  semester: number;
  branch: string;
  pdfPath?: string;
  isPublic: boolean;
  views: number;
  likes: number;
  createdAt: string;
  summary?: string;
  keyPoints?: string[];
}

export default function TeacherNoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    const fetchNote = async () => {
      if (!id) {
        setError('No note ID provided');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching note with ID:', id);
        const response = await apiClient.get(`/teacher-notes/${id}`);
        console.log('Note data received:', response.data);
        setNote(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching note:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        
        if (err.response?.status === 404) {
          setError('Note not found');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view this note');
        } else {
          setError('Failed to load note details');
        }
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  useEffect(() => {
    const fetchPdf = async () => {
      if (!id || !note) return;
      
      // Only try to fetch PDF if the note has a pdfPath
      if (!note.pdfPath) {
        console.log('Note has no PDF, skipping PDF fetch');
        return;
      }
      
      try {
        const response = await apiClient.get(`/teacher-notes/pdf/${id}`, {
          responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err: any) {
        console.error('Error fetching PDF:', err);
        // Don't set error for PDF loading failures if it's just a missing PDF
        if (err.response?.status !== 404) {
          setError(prev => prev || 'Failed to load PDF');
        }
      }
    };

    fetchPdf();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [id, note]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading note details...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/teacher/dashboard')}>Back to Dashboard</button>
        </div>
      </Layout>
    );
  }

  if (!note) {
    return (
      <Layout>
        <div className="not-found-container">
          <h2>Note Not Found</h2>
          <p>The requested note could not be found.</p>
          <button onClick={() => navigate('/teacher/dashboard')}>Back to Dashboard</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="teacher-note-detail-container">
        <div className="note-header">
          <button onClick={() => navigate('/teacher/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
          <div className="note-status">
            {note.isPublic ? (
              <span className="status published">Published</span>
            ) : (
              <span className="status draft">Draft</span>
            )}
          </div>
        </div>

        <div className="note-info-card">
          <h1>{note.title}</h1>
          <div className="note-metadata">
            <p><strong>Subject:</strong> {note.subject}</p>
            <p><strong>Module:</strong> {note.module}</p>
            <p><strong>Semester:</strong> {note.semester}</p>
            <p><strong>Branch:</strong> {note.branch}</p>
            <p><strong>Created:</strong> {new Date(note.createdAt).toLocaleDateString()}</p>
            <p><strong>Views:</strong> {note.views}</p>
            <p><strong>Likes:</strong> {note.likes}</p>
          </div>
        </div>

        {/* Show PDF if available */}
        {note.pdfPath && pdfUrl && (
          <div className="pdf-container">
            <h2>PDF Document</h2>
            <iframe 
              src={pdfUrl}
              title={note.title}
              width="100%"
              height="800px"
              style={{ border: 'none' }}
            />
          </div>
        )}

        {/* Show content if available and no PDF */}
        {note.content && (!note.pdfPath || !pdfUrl) && (
          <div className="content-container">
            <h2>Note Content</h2>
            <div className="note-content">
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{note.content}</pre>
            </div>
          </div>
        )}

        {/* Show summary if available */}
        {note.summary && (
          <div className="summary-container">
            <h2>Summary</h2>
            <p>{note.summary}</p>
          </div>
        )}

        {/* Show key points if available */}
        {note.keyPoints && note.keyPoints.length > 0 && (
          <div className="key-points-container">
            <h2>Key Points</h2>
            <ul>
              {note.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Show message if neither PDF nor content is available */}
        {!note.pdfPath && !note.content && (
          <div className="no-content-container">
            <h2>No Content Available</h2>
            <p>This note doesn't have any content or PDF attached.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}