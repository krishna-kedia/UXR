import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar__logo">
        SOME AI
      </div>

      <div className="sidebar__project">
        <button className="project-dropdown">
          Project 1 ▼
        </button>
      </div>

      <nav className="sidebar__menu">
        <ul>
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `sidebar__menu-link ${isActive ? 'active' : ''}`
              }
            >
              CALLS
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/analysis" 
              className={({ isActive }) => 
                `sidebar__menu-link ${isActive ? 'active' : ''}`
              }
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