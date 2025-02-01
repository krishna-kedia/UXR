import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectList from '../../components/ProjectList/ProjectList';
import NewProjectDialogueBox from '../../components/NewProjectDialogueBox/NewProjectDialogueBox';
import Alert from '../../components/Alert/Alert';
import Loader from '../../components/Loader/Loader';
import './ProjectPage.css';

function ProjectPage() {
    const navigate = useNavigate();
    const [showDialogue, setShowDialogue] = useState(false);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    const showMessage = (message, type) => {
        setAlert({ show: true, type, message });
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
            showMessage(error.message, 'error');
        } finally {
            setIsLoading(false);
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

            navigate(`/project/${data._id}`);
            showMessage('Project created successfully!', 'success');
            setShowDialogue(false);
            fetchProjects();
            
        } catch (error) {
            showMessage(error.message, 'error');
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <div className="project-container">
            {isLoading ? (
                <div className="loader-container">
                    <Loader />
                </div>
            ) : (
                <>
                    <div className="project-header">
                        <h1>Welcome {JSON.parse(localStorage.getItem('user')).firstName}, here are your active projects</h1>
                        <button 
                            className="new-project-btn"
                            onClick={() => setShowDialogue(true)}
                        >
                            New Project
                        </button>
                    </div>

                    <ProjectList projects={projects} />

                    {showDialogue && (
                        <NewProjectDialogueBox
                            onClose={() => setShowDialogue(false)}
                            onAdd={handleAddProject}
                        />
                    )}

                    {alert.show && (
                        <Alert 
                            type={alert.type}
                            message={alert.message}
                            onClose={() => setAlert({ show: false, type: '', message: '' })}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default ProjectPage; 