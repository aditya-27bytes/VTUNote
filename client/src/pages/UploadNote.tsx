import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";

interface ProcessedResult {
  extractedText: string;
  summary: string;
  numPages: number;
  provider: string;
  flashcards: Array<{
    question: string;
    answer: string;
    explanation: string;
    difficulty: string;
  }>;
  keyPoints: string[];
  concepts: Array<{
    term: string;
    definition: string;
    explanation: string;
  }>;
  images: Array<{
    filename: string;
    path: string;
    pageNumber: number;
    description?: string;
    isImportant?: boolean;
    size?: number;
    mimetype?: string;
  }>;
}

const UploadNote: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    module: "",
    subject: "",
    isPublic: false
  });
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState("perplexity");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [noteResponse, setNoteResponse] = useState<any>(null);
  const navigate = useNavigate();

  const vtuModules = [
    "Module 1", "Module 2", "Module 3", "Module 4", "Module 5"
  ];

  const commonSubjects = {
    "Computer Science and Engineering": [
      "Data Structures", "Algorithms", "Database Management System", "Computer Networks",
      "Operating Systems", "Software Engineering", "Compiler Design", "Machine Learning",
      "Web Programming", "Object Oriented Programming", "Computer Graphics", "Distributed Systems"
    ],
    "Information Science and Engineering": [
      "Data Structures", "Database Management System", "Computer Networks", "Software Engineering",
      "Web Technologies", "Information Security", "Data Analytics", "Cloud Computing"
    ],
    "Electronics and Communication Engineering": [
      "Digital Electronics", "Analog Electronics", "Signal Processing", "Communication Systems",
      "Microprocessors", "VLSI Design", "Embedded Systems", "Control Systems"
    ],
    "default": [
      "Mathematics", "Physics", "Chemistry", "Engineering Mechanics", "Thermodynamics",
      "Fluid Mechanics", "Material Science", "Engineering Drawing", "Programming in C"
    ]
  };

  const getSubjectsForBranch = () => {
    return commonSubjects[user?.branch as keyof typeof commonSubjects] || commonSubjects.default;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateFile = (file: File): string | null => {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return "Please select a valid PDF file";
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return "File size must be less than 10MB";
    }
    return null;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a PDF file");
      return;
    }
    
    const fileError = validateFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    
    if (!formData.title.trim() || !formData.module || !formData.subject) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      console.log("📤 Starting comprehensive PDF processing...");
      
      // Step 1: Upload and extract text from PDF
      const uploadFormData = new FormData();
      uploadFormData.append("pdf", file, file.name);
      
      console.log("Step 1: Extracting text from PDF...");
      const pdfResponse = await apiClient.post("/pdf/upload", uploadFormData);
      const { text, numPages, images, pdfPath, originalFileName } = pdfResponse.data;
      
      if (!text || text.trim().length === 0) {
        throw new Error("No text could be extracted from the PDF");
      }

      // Step 2: Generate comprehensive AI analysis
      console.log("Step 2: Generating comprehensive AI analysis...");
      const aiResponse = await apiClient.post("/ai/comprehensive-analysis", {
        text: text,
        provider: provider,
        module: formData.module,
        subject: formData.subject,
        context: {
          branch: user?.branch,
          semester: user?.semester,
          university: "VTU"
        }
      });

      const analysisResult = aiResponse.data;

      // Step 3: Save the note with all processed data
      console.log("Step 3: Saving comprehensive note...");
      const saveResponse = await apiClient.post("/notes", {
        title: formData.title,
        module: formData.module,
        subject: formData.subject,
        semester: user?.semester,
        branch: user?.branch,
        content: text,
        summary: analysisResult.summary,
        provider: provider,
        numPages: numPages,
        extractedText: text,
        flashcards: analysisResult.flashcards || [],
        keyPoints: analysisResult.keyPoints || [],
        concepts: analysisResult.concepts || [],
        extractedImages: images || [],
        isPublic: formData.isPublic,
        pdfPath: pdfPath,
        originalFileName: originalFileName,
        noteType: 'student' // Explicitly set as student note
      });

      setResult({
        extractedText: text,
        summary: analysisResult.summary,
        numPages: numPages,
        provider: provider,
        flashcards: analysisResult.flashcards || [],
        keyPoints: analysisResult.keyPoints || [],
        concepts: analysisResult.concepts || [],
        images: images || [] // Add images to result
      });
      setNoteResponse(saveResponse);
      setLoading(false);

      console.log("✅ Processing completed successfully!");

    } catch (err: any) {
      console.error("❌ Processing error:", err);
      let errorMessage = "Processing failed";
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (!result) return null;

    switch (activeTab) {
      case "summary":
        return (
          <div>
            <h4>📚 VTU-Aligned Summary</h4>
            <div className="content-box">
              {result.summary}
            </div>
          </div>
        );

      case "flashcards":
        return (
          <div>
            <h4>🎯 Generated Flashcards ({result.flashcards.length})</h4>
            <div className="flashcards-grid">
              {result.flashcards.map((card, index) => (
                <div key={index} className="flashcard-preview">
                  <div className="card-difficulty">
                    <span className={`difficulty ${card.difficulty}`}>{card.difficulty}</span>
                  </div>
                  <div className="flashcard-content">
                    <h5>Question {index + 1}</h5>
                    <div className="question-text">{card.question}</div>
                    
                    <div className="answer-section">
                      <h6>Answer:</h6>
                      <div className="answer-text">{card.answer}</div>
                    </div>
                    
                    {card.explanation && (
                      <div className="explanation-section">
                        <h6>Explanation:</h6>
                        <div className="explanation-text">{card.explanation}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "concepts":
        return (
          <div>
            <h4>🧠 Key Concepts ({result.concepts.length})</h4>
            <div className="concepts-list">
              {result.concepts.map((concept, index) => (
                <div key={index} className="concept-card">
                  <h5>{concept.term}</h5>
                  <p><strong>Definition:</strong> {concept.definition}</p>
                  {concept.explanation && (
                    <p><strong>Explanation:</strong> {concept.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "images":
        return (
          <div>
            <h4>🖼️ Important Pictures ({result.images?.length || 0})</h4>
            {result.images && result.images.length > 0 ? (
              <div className="images-gallery">
                {result.images.map((image, index) => (
                  <div key={index} className="image-card" onClick={() => setSelectedImage(`/api/uploads/images/${image.filename}`)}>
                    <img 
                      src={`/api/uploads/images/${image.filename}`} 
                      alt={image.description || `Page ${image.pageNumber}`}
                      className="image-preview"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="image-info">
                      <div className="image-title">
                        {image.description || `Image from Page ${image.pageNumber}`}
                      </div>
                      <div className="image-meta">
                        <span className="page-number">Page {image.pageNumber}</span>
                        {image.isImportant && <span className="important-badge">Important</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-images">
                <div className="icon">🖼️</div>
                <p>No images were extracted from this PDF</p>
                <small>This could mean the PDF contains no images or they couldn't be processed</small>
              </div>
            )}
          </div>
        );

      case "keypoints":
        return (
          <div>
            <h4>🔑 Key Points ({result.keyPoints.length})</h4>
            <ul className="key-points-list">
              {result.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        );

      case "original":
        return (
          <div>
            <h4>📝 Original Text</h4>
            <div className="content-box" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {result.extractedText}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="page">
        <div className="upload-header">
          <h2>📤 Upload PDF Note</h2>
          <p>Generate flashcards, summaries, and key concepts from your PDF notes</p>
        </div>

        {!result ? (
          <form onSubmit={handleUpload} className="upload-form">
            {error && (
              <div className="error-message" style={{ 
                color: '#dc3545', 
                background: '#f8d7da', 
                border: '1px solid #f5c6cb', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px' 
              }}>
                {error}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>Note Title *</label>
                <input
                  type="text"
                  placeholder="Enter descriptive title for your notes"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>VTU Module *</label>
                <select 
                  value={formData.module} 
                  onChange={(e) => handleInputChange('module', e.target.value)}
                  required
                >
                  <option value="">Select Module</option>
                  {vtuModules.map((module) => (
                    <option key={module} value={module}>{module}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Subject *</label>
                <select 
                  value={formData.subject} 
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  required
                >
                  <option value="">Select Subject</option>
                  {getSubjectsForBranch().map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>AI Provider</label>
                <select 
                  value={provider} 
                  onChange={(e) => setProvider(e.target.value)}
                >
                  <option value="perplexity">Perplexity (Recommended)</option>
                  <option value="openai">OpenAI GPT</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="huggingface">Hugging Face</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>PDF File * (Max 10MB)</label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
              {file && (
                <div className="file-info">
                  📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                />
                Make this note public (other students can view)
              </label>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className={`upload-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing PDF...
                </>
              ) : (
                "🚀 Generate Comprehensive Notes"
              )}
            </button>
          </form>
        ) : (
          <div className="results-section">
            <div className="results-header">
              <h3>✅ Processing Complete!</h3>
              <div className="meta-info">
                📄 {result.numPages} pages | 🤖 {result.provider} | 🎆 {result.flashcards.length} flashcards | 📝 {result.keyPoints.length} key points | 🖼️ {result.images?.length || 0} images
              </div>
            </div>

            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                📚 Summary
              </button>
              <button 
                className={`tab ${activeTab === 'flashcards' ? 'active' : ''}`}
                onClick={() => setActiveTab('flashcards')}
              >
                🎯 Flashcards ({result.flashcards.length})
              </button>
              <button 
                className={`tab ${activeTab === 'concepts' ? 'active' : ''}`}
                onClick={() => setActiveTab('concepts')}
              >
                🧠 Concepts ({result.concepts.length})
              </button>
              <button 
                className={`tab ${activeTab === 'images' ? 'active' : ''}`}
                onClick={() => setActiveTab('images')}
              >
                🖼️ Pictures ({result.images?.length || 0})
              </button>
              <button 
                className={`tab ${activeTab === 'keypoints' ? 'active' : ''}`}
                onClick={() => setActiveTab('keypoints')}
              >
                🔑 Key Points ({result.keyPoints.length})
              </button>
              <button 
                className={`tab ${activeTab === 'original' ? 'active' : ''}`}
                onClick={() => setActiveTab('original')}
              >
                📝 Original Text
              </button>
            </div>

            <div className="tab-content">
              {renderTabContent()}
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                className="submit-btn"
                onClick={() => {
                  const noteId = (noteResponse as any)?.data?._id || (noteResponse as any)?.data?.note?._id;
                  if (noteId) {
                    navigate(`/quiz?noteId=${encodeURIComponent(noteId)}`);
                  } else {
                    navigate('/quiz');
                  }
                }}
              >
                Start Quick Quiz →
              </button>
            </div>
          </div>
        )}
        
        {/* Image Modal */}
        {selectedImage && (
          <div className="image-modal" onClick={() => setSelectedImage(null)}>
            <button className="close-btn" onClick={() => setSelectedImage(null)}>
              ×
            </button>
            <img src={selectedImage} alt="Enlarged view" />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UploadNote;
