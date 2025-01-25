import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconButton, Typography } from '@mui/material';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import StorageIcon from '@mui/icons-material/Storage'; // Data
import LocalOfferIcon from '@mui/icons-material/LocalOffer'; // Tagging
import AssessmentIcon from '@mui/icons-material/Assessment'; // Analysis
import BarChartIcon from '@mui/icons-material/BarChart'; // Reporting
import './Sidebar.css';

function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandTimer, setExpandTimer] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    
    const projectId = location.pathname.split('/').find(segment => 
        segment.match(/^[0-9a-fA-F]{24}$/)
    );

    const handleMouseEnter = () => {
        const timer = setTimeout(() => {
            setIsExpanded(true);
        }, 200);
        setExpandTimer(timer);
    };

    const handleMouseLeave = () => {
        clearTimeout(expandTimer);
        setIsExpanded(false);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const navigationItems = [
        { icon: <StorageIcon />, label: 'Data', path: `/project/${projectId}` },
        { icon: <LocalOfferIcon />, label: 'Tagging', path: `/project/${projectId}/tagging` },
        { icon: <AssessmentIcon />, label: 'Analysis', path: `/project/${projectId}/analysis` },
        { icon: <BarChartIcon />, label: 'Reporting', path: `/project/${projectId}/reporting` },
    ];

    return (
        <div 
            className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="sidebar-top">
                <div className="logo-container">
                    {/* Placeholder logo */}
                    <img src="/logo.png" alt="Logo" className="logo-icon" />
                    {isExpanded && (
                        <Typography variant="h6" className="logo-text">
                            Papyrus
                        </Typography>
                    )}
                </div>
                {!isExpanded && (
                    <IconButton onClick={handleBack} className="back-button">
                        <KeyboardBackspaceIcon />
                    </IconButton>
                )}
            </div>

            <nav className="sidebar-nav">
                {navigationItems.map((item) => (
                    <div 
                        key={item.label} 
                        className="nav-item"
                        onClick={() => navigate(item.path)}
                    >
                        {item.icon}
                        {isExpanded && (
                            <span className="nav-label">{item.label}</span>
                        )}
                    </div>
                ))}
            </nav>

            <div className="sidebar-bottom">
                <div 
                    className="nav-item"
                    onClick={() => navigate(`/project/${projectId}/settings`)}
                >
                    <SettingsIcon />
                    {isExpanded && (
                        <span className="nav-label">Settings</span>
                    )}
                </div>
                <div 
                    className="nav-item"
                    onClick={() => navigate(`/user/${user.id}/settings`)}
                >
                    <PersonIcon />
                    {isExpanded && (
                        <span className="nav-label">Profile</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Sidebar;