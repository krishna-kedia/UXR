import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChatIcon from '@mui/icons-material/Chat';
import LogoutIcon from '@mui/icons-material/Logout';
import './Sidebar.css';
import logo from './images.png';

function Sidebar({ onExpand }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandTimer, setExpandTimer] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    
    const projectData = JSON.parse(sessionStorage.getItem('projectData'));

    const handleMouseEnter = () => {
        const timer = setTimeout(() => {
            setIsExpanded(true);
        }, 200);
        setExpandTimer(timer);
        onExpand?.(true);
    };

    const handleMouseLeave = () => {
        clearTimeout(expandTimer);
        setIsExpanded(false);
        onExpand?.(false);
    };

    const handleNavigation = (path) => {
        if (path === 'transcripts' && projectData) {
            navigate(`/project/${projectData._id}`);
        } else if (path === 'analysis' && projectData) {
            navigate(`/analysis/${projectData._id}`);
        } else if (path === 'chat') {
            navigate('/chat');
        } else if (path === 'home' || !projectData) {
            navigate('/');
        } else if (path === 'logout') {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
        }
    };

    const navigationItems = [
        { icon: <HomeIcon />, label: 'All Projects', path: 'home' },
        { icon: <DescriptionIcon />, label: 'Transcripts', path: 'transcripts' },
        { icon: <AssessmentIcon />, label: 'Analysis', path: 'analysis' },
        { icon: <ChatIcon />, label: 'Chat', path: 'chat' },
        { icon: <LogoutIcon />, label: 'Logout', path: 'logout' },
    ];

    return (
        <div 
            className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="sidebar-top">
                <div className="logo-container" onClick={() => navigate('/')}>
                    <img src={logo} alt="Logo" className="logo-icon" />
                    {isExpanded && (
                        <Typography variant="h6" className="logo-text">
                            Papyrus
                        </Typography>
                    )}
                </div>
            </div>

            <nav className="sidebar-nav">
                {navigationItems.map((item) => (
                    <div 
                        key={item.label} 
                        className={`nav-item nav-item-${item.label} ${location.pathname === (item.path === 'home' ? '/' : `/${item.path}`) ? 'active' : ''}`}
                        onClick={() => handleNavigation(item.path)}
                    >
                        {React.cloneElement(item.icon, { sx: { fontWeight: 300 } })}
                        {isExpanded && (
                            <span className="nav-label">{item.label}</span>
                        )}
                    </div>
                ))}
            </nav>
        </div>
    );
}

export default Sidebar;