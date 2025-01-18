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

// Layout for authenticated pages with sidebar and navbar
function AuthenticatedLayout({ children }) {
  return (
    <div className="app-container">
      <div className="sidebar-container">
        <Sidebar />
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
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route */}
          <Route 
            path="/login" 
            element={
              <LoginLayout>
                <Login />
              </LoginLayout>
            } 
          />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/projects" replace />} />
                    <Route path="/projects" element={<ProjectPage />} />
                    <Route path="/project/:projectId" element={<IndividualProjectPage />} />
                    <Route path="/questions" element={<QuestionsPage />} />
                    <Route path="/calls" element={<div>Calls Page</div>} />
                    <Route path="/analysis" element={<div>Analysis Page</div>} />
                    <Route path="/chat" element={<div>Chat Page</div>} />
                    <Route path="/notes" element={<div>Notes Page</div>} />
                    <Route path="/analysis/:projectId" element={<AnalysisPage />} />
                  </Routes>
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
            path="/*"
          />

          {/* Catch all other routes and redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
