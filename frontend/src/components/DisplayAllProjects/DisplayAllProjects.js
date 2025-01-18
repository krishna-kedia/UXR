import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DisplayAllProjects.css';

function DisplayAllProjects({ project }) {
    const navigate = useNavigate();

    const handleClick = () => {
        // Will implement navigation to project details later
        navigate(`/project/${project._id}`);
    };

    return (
        <div className="project-row" onClick={handleClick}>
            <div className="project-name">{project.projectName}</div>
            <div className="project-transcripts">{project.transcripts.length}</div>
            <div className="project-date">
                {new Date(project.createdAt).toLocaleDateString()}
            </div>
        </div>
    );
}

export default DisplayAllProjects; 