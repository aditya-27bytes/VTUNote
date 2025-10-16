import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTeacherAuth } from "../contexts/TeacherAuthContext";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { teacher, logout: teacherLogout } = useTeacherAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState('');

  const handleLogout = () => {
    if (user) {
      logout();
    } else if (teacher) {
      teacherLogout();
    }
    navigate('/');
  };

  // Set active item based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) setActiveItem('dashboard');
    else if (path.includes('/upload')) setActiveItem('upload');
    else if (path.includes('/notes')) setActiveItem('notes');
    else if (path.includes('/flashcards')) setActiveItem('flashcards');
    else if (path.includes('/quiz')) setActiveItem('quiz');
    else if (path.includes('/connections')) setActiveItem('connections');
    else if (path.includes('/admin')) setActiveItem('admin');
    else if (path.includes('/profile')) setActiveItem('profile');
    else setActiveItem('');
  }, [location.pathname]);

  // Navigation items for students
  const studentNavItems = [
    { path: '/dashboard', icon: '📊', label: 'Home', key: 'dashboard' },
    { path: '/upload', icon: '📤', label: 'Upload', key: 'upload' },
    { path: '/notes', icon: '📝', label: 'Notes', key: 'notes' },
    { path: '/student-notes', icon: '📚', label: 'Shared', key: 'shared', special: true },
    { path: '/flashcards', icon: '🎴', label: 'Cards', key: 'flashcards' },
    { path: '/quiz', icon: '🧠', label: 'Quiz', key: 'quiz' },
    { path: '/connections', icon: '👥', label: 'Teachers', key: 'connections' },
    ...(user?.role === 'admin' ? [{ path: '/admin', icon: '⚙️', label: 'Admin', key: 'admin' }] : [])
  ];

  // Navigation items for teachers
  const teacherNavItems = [
    { path: '/teacher/dashboard', icon: '🏠', label: 'Home', key: 'dashboard' },
    { path: '/teacher/quizzes', icon: '📝', label: 'Quizzes', key: 'quizzes' },
    { path: '/teacher/connections', icon: '👥', label: 'Students', key: 'connections' }
  ];

  // Auth navigation items
  const authNavItems = [
    { path: '/login', icon: '🔐', label: 'Login', key: 'login' },
    { path: '/register', icon: '📋', label: 'Register', key: 'register' },
    { path: '/teacher/login', icon: '👨‍🏫', label: 'Teacher', key: 'teacher-login' }
  ];

  const currentNavItems = user ? studentNavItems : teacher ? teacherNavItems : authNavItems;

  // Check if user is authenticated (student or teacher)
  const isAuthenticated = user || teacher;

  return (
    <nav className={`minimal-navbar ${isExpanded ? 'expanded' : ''} ${isAuthenticated ? 'right-aligned' : ''}`}>
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo" onClick={() => setIsExpanded(false)}>
          <span className="logo-icon">📚</span>
          <span className="logo-text">VTU</span>
        </Link>

        {/* Navigation Items */}
        <div className="nav-items">
          {currentNavItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`nav-item ${
                activeItem === item.key ? 'active' : ''
              } ${(item as any).special ? 'special' : ''}`}
              onClick={() => setIsExpanded(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Profile & Logout Section */}
        {(user || teacher) && (
          <div className="nav-profile">
            <Link 
              to={user ? '/profile' : '/teacher/profile'}
              className={`nav-item ${activeItem === 'profile' ? 'active' : ''}`}
              title={user ? `${user.name} - View Profile` : `${teacher?.name} - View Profile`}
            >
              <span className="nav-icon">
                {user ? '👤' : '👨‍🏫'}
              </span>
              <span className="nav-label">
                {user ? user.name : teacher?.name}
              </span>
            </Link>
            <button 
              onClick={handleLogout}
              className="nav-item logout-btn"
              title="Logout"
            >
              <span className="nav-icon">🚪</span>
              <span className="nav-label">Logout</span>
            </button>
          </div>
        )}

        {/* Expand/Collapse Toggle for Mobile */}
        <button 
          className="nav-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label="Toggle navigation"
        >
          <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>⚡</span>
        </button>
      </div>
    </nav>
  );
}
