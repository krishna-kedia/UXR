import React from 'react';
import './UploadProgress.css';

const UploadProgress = ({ progress }) => {
  return (
    <div className="upload-progress">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="progress-text">{progress}% Uploaded</span>
    </div>
  );
};

export default UploadProgress;