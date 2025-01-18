import React, { useState } from 'react';
import './NewProjectDialogueBox.css';

function NewProjectDialogueBox({ onClose, onAdd }) {
    const [projectName, setProjectName] = useState('');

    const handleSubmit = (e) => {
        const userId = localStorage.getItem('userId');
        e.preventDefault();
        onAdd(projectName, userId);
        setProjectName('');
        console.log(projectName);
    };

    return (
        <div className="dialogue-overlay">
            <div className="dialogue-container">
                <h2>New Project</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="projectName">Project Name</label>
                        <input
                            type="text"
                            id="projectName"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Enter project name"
                        />
                    </div>
                    <div className="dialogue-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn">
                            Add Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewProjectDialogueBox; 