import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectList from '../../components/ProjectList/ProjectList';
import NewProjectDialogueBox from '../../components/NewProjectDialogueBox/NewProjectDialogueBox';
import DeleteConfirmationDialog from '../../components/DeleteConfirmationDialog/DeleteConfirmationDialog';
import Alert from '../../components/Alert/Alert';
import Loader from '../../components/Loader/Loader';
import './ProjectPage.css';

function ProjectPage() {
    const navigate = useNavigate();
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    const showMessage = (message, type) => {
        setAlert({ show: true, type, message });
    };

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects', {
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

    const handleAddProject = async (projectName) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const userId = user.id;
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ projectName, userId: user.id })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create project');
            }

            navigate(`/project/${data._id}`);
            showMessage('Project created successfully!', 'success');
            setShowNewDialog(false);
            fetchProjects();
        } catch (error) {
            showMessage(error.message, 'error');
        }
    };

    const handleEditProject = async (projectName) => {
        try {
            const response = await fetch(`/api/projects/${selectedProject._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ projectName })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update project');
            }

            showMessage('Project updated successfully!', 'success');
            setShowEditDialog(false);
            setSelectedProject(null);
            fetchProjects();
        } catch (error) {
            showMessage(error.message, 'error');
        }
    };

    const handleDeleteProject = async () => {
        try {
            const response = await fetch(`/api/projects/${selectedProject._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete project');
            }

            showMessage('Project deleted successfully!', 'success');
            setShowDeleteDialog(false);
            setSelectedProject(null);
            fetchProjects();
        } catch (error) {
            showMessage(error.message, 'error');
        }
    };

    const onEdit = (project) => {
        setSelectedProject(project);
        setShowEditDialog(true);
    };

    const onDelete = (project) => {
        setSelectedProject(project);
        setShowDeleteDialog(true);
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
                            onClick={() => setShowNewDialog(true)}
                        >
                            New Project
                        </button>
                    </div>

                    <ProjectList 
                        projects={projects}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />

                    {showNewDialog && (
                        <NewProjectDialogueBox
                            onClose={() => setShowNewDialog(false)}
                            onAdd={handleAddProject}
                        />
                    )}

                    {showEditDialog && (
                        <NewProjectDialogueBox
                            onClose={() => {
                                setShowEditDialog(false);
                                setSelectedProject(null);
                            }}
                            onAdd={handleEditProject}
                            initialValue={selectedProject?.projectName}
                            isEdit={true}
                        />
                    )}

                    {showDeleteDialog && selectedProject && (
                        <DeleteConfirmationDialog
                            open={showDeleteDialog}
                            onClose={() => {
                                setShowDeleteDialog(false);
                                setSelectedProject(null);
                            }}
                            onConfirm={handleDeleteProject}
                            projectName={selectedProject.projectName}
                            transcriptsCount={selectedProject.transcripts?.length || 0}
                            questionsCount={selectedProject.questions?.length || 0}
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