import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/LoginPage/Login';
import HomePage from './pages/HomePage/HomePage';
import QuestionsPage from './pages/QuestionsPage/QuestionsPage';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import './App.css';

function MainLayout({ children }) {
  return (
    <div className="app-container">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="pages-container">
        <Navbar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

// Create a layout component for the login page
function LoginLayout({ children }) {
  return (
    <div className="login-layout">
      {children}
    </div>
  );
}

// Wrapper component to choose the appropriate layout
function AppContent() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calls" element={<div>Calls Page</div>} />
        <Route path="/analysis" element={<div>Analysis Page</div>} />
        <Route path="/chat" element={<div>Chat Page</div>} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/notes" element={<div>Notes Page</div>} />
      </Routes>
    </MainLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />
          
          {/* Redirect all other routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
