import React from 'react';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <h1 className="navbar-title">Dashboard</h1>
      <div className="profile-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#1A1A1A"/>
          <path d="M16 8C13.79 8 12 9.79 12 12C12 14.21 13.79 16 16 16C18.21 16 20 14.21 20 12C20 9.79 18.21 8 16 8ZM16 18C13.33 18 8 19.34 8 22V24H24V22C24 19.34 18.67 18 16 18Z" fill="white"/>
        </svg>
      </div>
    </nav>
  );
}

export default Navbar; 