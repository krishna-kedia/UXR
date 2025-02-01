import React, { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import './Alert.css';

function Alert({ type, message, onClose }) {
    const [isExiting, setIsExiting] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Start exit animation after 5 seconds
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, 2000);

        // Remove component after exit animation (5s + 1s for animation)
        const removeTimer = setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 2300);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 300);
    };

    if (!isVisible) return null;

    return (
        <div className={`alert-container ${type} ${isExiting ? 'exit' : ''}`}>
            <div className="alert-content">
                {message}
                <button className="close-button" onClick={handleClose}>
                    <CloseIcon />
                </button>
            </div>
            <div className="progress-bar" />
        </div>
    );
}

export default Alert; 