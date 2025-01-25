import React, { useState, useEffect } from 'react';
import NewProjectDialogueBox from '../../components/NewProjectDialogueBox/NewProjectDialogueBox';
import DisplayAllProjects from '../../components/DisplayAllProjects/DisplayAllProjects';
import ProjectList from '../../components/ProjectList/ProjectList';
import './ProjectPage.css';

function ProjectPage() {
    const [showDialogue, setShowDialogue] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [projects, setProjects] = useState([]);

    const showMessage = (message, isError = false) => {
        if (isError) {
            setError(message);
            setTimeout(() => setError(null), 5000);
        } else {
            setSuccess(message);
            setTimeout(() => setSuccess(null), 5000);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/projects', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }

            const data = await response.json();
            setProjects(data);
        } catch (error) {
            showMessage(error.message, true);
        }
    };

    const handleAddProject = async (projectName, userId) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const userId = user.id;
            const response = await fetch('http://localhost:5001/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ projectName, userId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create project');
            }

            showMessage('Project created successfully!');
            setShowDialogue(false);
            fetchProjects(); // Refresh the projects list
            
        } catch (error) {
            showMessage(error.message, true);
        }
    };

    // Fetch projects when component mounts
    useEffect(() => {
        fetchProjects();
    }, []);

    const handleUploadNew = () => {
        // Handle upload new project logic
    };

    return (
        <div className="project-container">
            <div className="project-header">
                <h1>Welcome {JSON.parse(localStorage.getItem('user')).firstName}, here are your active projects</h1>
                <button 
                    className="new-project-btn"
                    onClick={() => setShowDialogue(true)}
                >
                    New Project
                </button>
            </div>

            {error && (
                <div className="message error-message">
                    {error}
                </div>
            )}
            {success && (
                <div className="message success-message">
                    {success}
                </div>
            )}

            <ProjectList projects={projects} onUploadNew={handleUploadNew} />

            {showDialogue && (
                <NewProjectDialogueBox
                    onClose={() => setShowDialogue(false)}
                    onAdd={handleAddProject}
                />
            )}
        </div>
    );
}

export default ProjectPage; 