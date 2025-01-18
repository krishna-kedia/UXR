import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract projectId from URL if we're in a project-specific route
  const projectId = location.pathname.split('/').find(segment => 
    segment.match(/^[0-9a-fA-F]{24}$/) // Matches MongoDB ObjectId format
  );

  const handleAnalysisClick = () => {
    if (projectId) {
      navigate(`/analysis/${projectId}`);
    } else {
      // Optionally handle the case when no project is selected
      console.warn('No project selected');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar__logo">
        SOME AI
      </div>

      <div className="sidebar__project">
        <div className="project-name">
          Project 1
        </div>
      </div>

      <nav className="sidebar__menu">
        <ul>
          <li>
            <NavLink 
              to="/projects"
              className={({ isActive }) => 
                `sidebar__menu-link ${isActive ? 'active' : ''}`
              }
            >
              TRANSCRIPTS
            </NavLink>
          </li>
          <li>
            <NavLink 
              to={projectId ? `/analysis/${projectId}` : '#'}
              className={({ isActive }) => 
                `sidebar__menu-link ${isActive ? 'active' : ''}`
              }
              onClick={(e) => {
                if (!projectId) {
                  e.preventDefault();
                }
              }}
            >
              ANALYSIS
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/chat" 
              className={({ isActive }) => 
                `sidebar__menu-link ${isActive ? 'active' : ''}`
              }
            >
              CHAT
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/questions" 
              className={({ isActive }) => 
                `sidebar__menu-link ${isActive ? 'active' : ''}`
              }
            >
              QUESTIONS
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/notes" 
              className={({ isActive }) => 
                `sidebar__menu-link ${isActive ? 'active' : ''}`
              }
            >
              NOTES
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;