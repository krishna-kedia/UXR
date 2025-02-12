import React from 'react';
import { Card, CardContent, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import './ProjectList.css';

function ProjectList({ projects, onEdit, onDelete }) {
    const navigate = useNavigate();

    const handleProjectClick = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    return (
        <div className="project-list">
            {projects.map((project) => (
                <Card 
                    key={project._id} 
                    className="project-card"
                    onClick={() => handleProjectClick(project._id)}
                >
                    <CardContent className="project-card-content">
                        <div className="project-info">
                            <div className="project-title">
                                <Typography variant="h6">{project.projectName}</Typography>
                            </div>
                            <div className="project-details">
                                <Typography color="textSecondary">
                                    {project.transcripts.length} files
                                </Typography>
                                <Typography color="textSecondary" className="dot-separator">
                                    •
                                </Typography>
                                <Typography color="textSecondary">
Created {getTimeAgo(project.createdAt)}
                                </Typography>
                                {/* <Typography color="textSecondary" className="dot-separator">
                                    •
                                </Typography> */}
                                {/* <Typography color="textSecondary">
                                    Last processed {getTimeAgo(project.questionsCreatedDateTime)}
                                </Typography> */}
                            </div>
                        </div>
                        <div className="project-actions">
                            <IconButton 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(project);
                                }}
                                className="action-button edit-button"
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(project);
                                }}
                                className="action-button delete-button"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Helper function to format time
function getTimeAgo(date) {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    return `${days}d ago`;
}

export default ProjectList; 