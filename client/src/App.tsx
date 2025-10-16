import { Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import StudentNotesPage from "./pages/StudentNotesPage";
import StudentNoteDetailPage from "./pages/StudentNoteDetailPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AdminPage from "./pages/AdminPage";
import Navbar from "./components/Navbar";

// Import styles
import "./styles/common.css";
import "./styles/notifications.css";
import "./styles/quiz.css";
import UploadNote from "./pages/UploadNote";
import NotesPage from "./pages/NotesPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import NoteDetailPage from "./pages/NoteDetailPage";
import HomePage from "./pages/HomePage";
import TeacherLoginPage from "./pages/TeacherLoginPage";
import TeacherRegisterPage from "./pages/TeacherRegisterPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherNoteDetail from "./pages/TeacherNoteDetail";
import StudentQuizPage from "./pages/StudentQuizPage";
import TeacherQuizPage from "./pages/TeacherQuizPage";
import StudentConnectionsPage from "./pages/StudentConnectionsPage";
import TeacherConnectionsPage from "./pages/TeacherConnectionsPage";
import AvailableQuizzesPage from "./pages/AvailableQuizzesPage";
import TakeQuizPage from "./pages/TakeQuizPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import TeacherProfilePage from "./pages/TeacherProfilePage";

import { useAuth } from "./contexts/AuthContext";
import { useTeacherAuth } from "./contexts/TeacherAuthContext";

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ padding: 24, textAlign: "center" }}>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/" replace />;
}

function AdminOnly({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ padding: 24, textAlign: "center" }}>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return user.role === "admin" ? children : <Navigate to="/dashboard" replace />;
}

function TeacherProtected({ children }: { children: JSX.Element }) {
  const { teacher, loading } = useTeacherAuth();
  
  if (loading) {
    return <div style={{ padding: 24, textAlign: "center" }}>Loading...</div>;
  }
  
  return teacher ? children : <Navigate to="/teacher/login" replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/upload"
          element={
            <Protected>
              <UploadNote />
            </Protected>
          }
        />
        <Route
          path="/notes"
          element={
            <Protected>
              <NotesPage />
            </Protected>
          }
        />
        <Route
          path="/notes/:id"
          element={
            <Protected>
              <NoteDetailPage />
            </Protected>
          }
        />
        <Route
          path="/connections"
          element={
            <Protected>
              <StudentConnectionsPage />
            </Protected>
          }
        />
        <Route
          path="/flashcards"
          element={
            <Protected>
              <FlashcardsPage />
            </Protected>
          }
        />
        <Route
          path="/quiz"
          element={
            <Protected>
              <StudentQuizPage />
            </Protected>
          }
        />
        <Route
          path="/student-notes"
          element={
            <Protected>
              <StudentNotesPage />
            </Protected>
          }
        />
        <Route
          path="/student-notes/:id"
          element={
            <Protected>
              <StudentNoteDetailPage />
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected>
              <AdminOnly>
                <AdminPage />
              </AdminOnly>
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <StudentProfilePage />
            </Protected>
          }
        />
        
        {/* Teacher Routes */}
        <Route path="/teacher/login" element={<TeacherLoginPage />} />
        <Route path="/teacher/register" element={<TeacherRegisterPage />} />
        <Route
          path="/teacher/dashboard"
          element={
            <TeacherProtected>
              <TeacherDashboard />
            </TeacherProtected>
          }
        />
        <Route
          path="/teacher/notes/:id"
          element={
            <TeacherProtected>
              <TeacherNoteDetail />
            </TeacherProtected>
          }
        />
        <Route
          path="/teacher/connections"
          element={
            <TeacherProtected>
              <TeacherConnectionsPage />
            </TeacherProtected>
          }
        />
        <Route
          path="/teacher/quizzes"
          element={
            <TeacherProtected>
              <TeacherQuizPage />
            </TeacherProtected>
          }
        />
        <Route
          path="/teacher/profile"
          element={
            <TeacherProtected>
              <TeacherProfilePage />
            </TeacherProtected>
          }
        />
        <Route
          path="/available-quizzes"
          element={
            <Protected>
              <AvailableQuizzesPage />
            </Protected>
          }
        />
        <Route path="quiz/:id" element={<Protected><TakeQuizPage /></Protected>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}