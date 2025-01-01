import React, { useState } from 'react';
import './RenameDialog.css';

const RenameDialog = ({ initialName, onSave, onCancel }) => {
  const [name, setName] = useState(initialName);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(name);
  };

  return (
    <div className="rename-dialog-overlay">
      <div className="rename-dialog">
        <h2>Rename File</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter file name"
            autoFocus
          />
          <div className="dialog-buttons">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameDialog; 