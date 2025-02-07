import React from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './LandingPage';
import './index.css'; // Optional: Add styles if needed.

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LandingPage />
  </React.StrictMode>
);
