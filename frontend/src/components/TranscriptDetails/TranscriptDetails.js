import React from 'react';
import { Videocam, Person } from '@mui/icons-material'; // Using MUI icons
import './TranscriptDetails.css';

const TranscriptDetails = ({ 
    transcript: { 
        name, 
        numberOfPeople, 
        duration, 
        origin, 
        imageUrl = 'https://placeholder.co/400x200' // default placeholder
    } 
}) => {
    const getOriginIcon = (origin) => {
        return origin === 'meeting_recorded' ? (
            <Videocam className="origin-icon" />
        ) : (
            <Person className="origin-icon" />
        );
    };

    return (
        <div className="transcript-card">
            <div className="transcript-image">
                <img src={imageUrl} alt={name} />
            </div>
            <div className="transcript-content">
                <div className="transcript-header">
                    <h3 className="transcript-name">{name}</h3>
                    {getOriginIcon(origin)}
                </div>
                <div className="transcript-details">
                    <div className="detail-item">
                        <span className="label">Duration:</span>
                        <span>{duration}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Participants:</span>
                        <span>{numberOfPeople}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TranscriptDetails;