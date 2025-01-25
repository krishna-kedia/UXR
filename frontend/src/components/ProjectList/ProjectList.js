import React from 'react';
import { Card, CardContent, Typography, IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';
import './ProjectList.css';

function ProjectList({ projects }) {
    const navigate = useNavigate();

    const handleProjectClick = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    const handleMoreClick = (e, projectId) => {
        e.stopPropagation(); // Prevent card click when clicking the more button
        // Handle more button click
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
                                    Updated {getTimeAgo(project.createdAt)}
                                </Typography>
                            </div>
                        </div>
                        <div className="project-actions">
                            <IconButton onClick={(e) => handleMoreClick(e, project._id)}>
                                <MoreVertIcon />
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