import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/LoginPage/Login';
import ProjectPage from './pages/ProjectPage/ProjectPage';
import IndividualProjectPage from './pages/IndividualProjectPage/IndividualProjectPage';
import QuestionsPage from './pages/QuestionsPage/QuestionsPage';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import './App.css';
import AnalysisPage from './pages/AnalysisPage/AnalysisPage';
import ChatPage from './pages/ChatPage/ChatPage';
import LandingPage from './pages/LandingPage/LandingPage';
import { useState } from 'react';
import './index.css';

// Layout for authenticated pages with sidebar and navbar
function AuthenticatedLayout({ children }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const handleSidebarExpand = (expanded) => {
    setIsSidebarExpanded(expanded);
  };

  return (
    <div className="app-container">
      <div className={`sidebar-container ${isSidebarExpanded ? 'expanded' : ''}`}>
        <Sidebar onExpand={handleSidebarExpand} />
      </div>
      <div className="pages-container">
        {/* <Navbar /> */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

// Layout for the login page (no sidebar/navbar)
function LoginLayout({ children }) {
  return (
    <div className="login-layout">
      {children}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes - outside AuthProvider */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />  {/* Login stays outside */}

        {/* Protected routes - wrapped in AuthProvider */}
        <Route
          path="/*"
          element={
            <AuthProvider>
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Routes>
                    <Route path="/dashboard" element={<ProjectPage />} />
                    <Route path="/project/:projectId" element={<IndividualProjectPage />} />
                    <Route path="/questions" element={<QuestionsPage />} />
                    <Route path="/calls" element={<div>Calls Page</div>} />
                    <Route path="/analysis" element={<div>Analysis Page</div>} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/notes" element={<div>Notes Page</div>} />
                    <Route path="/analysis/:projectId" element={<AnalysisPage />} />
                  </Routes>
                </AuthenticatedLayout>
              </ProtectedRoute>
            </AuthProvider>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

