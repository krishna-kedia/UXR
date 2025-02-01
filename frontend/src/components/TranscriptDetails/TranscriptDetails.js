import React from 'react';
import { Videocam, Person } from '@mui/icons-material'; // Using MUI icons
import './TranscriptDetails.css';
import image from './images.jpeg'


const TranscriptDetails = ({   
    transcript: { 
        name, 
        origin, 
        imageUrl = image,
        processing,
        isUploading,
        transcriptName,
        metadata,
        botStatus
    } 
}) => {
    const getOriginIcon = (origin) => {
        return origin === 'meeting_recording' ? (
            <Videocam className="origin-icon" />
        ) : (
            <Person className="origin-icon" />
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'joining_call': return 'status-joining';
            case 'in_waiting_room': return 'status-waiting';
            case 'in_call_not_recording': return 'status-not-recording';
            case 'in_call_recording': return 'status-recording';
            case 'call_ended': return 'status-ended';
            case 'error': return 'status-error';
            default: return 'status-default';
        }
    };

    return (
        <div className={`transcript-card ${isUploading ? 'uploading' : ''}`}>
            <div className="transcript-image">
                <img src={imageUrl} alt={transcriptName} />
                {processing && <div className="overlay"><span className="recording-icon">🔴</span></div>}
                {isUploading && (
                    <div className="overlay">
                        <span className="uploading-text">Uploading...</span>
                    </div>
                )}
            </div>
            <div className="transcript-content">
                <div className="transcript-header">
                    <h3 className="transcript-name">
                        {transcriptName || name}
                    </h3>
                    {!processing && getOriginIcon(origin)}
                </div>
                {origin === 'meeting_recording' && botStatus && botStatus.status && (
                    <div className={`status-badge ${getStatusColor(botStatus.status.code)}`}>
                        {botStatus.status.code.replace(/_/g, ' ')}
                    </div>
                )}
                <div className="transcript-metadata">
                    {metadata && (
                        <div className="metadata-grid">
                            {metadata.no_of_people && (
                                <div className="metadata-item">
                                    <span className="metadata-label">Participants</span>
                                    <span className="metadata-value">{metadata.no_of_people}</span>
                                </div>
                            )}
                            {metadata.interviewer_name && (
                                <div className="metadata-item">
                                    <span className="metadata-label">Interviewer</span>
                                    <span className="metadata-value">{metadata.interviewer_name}</span>
                                </div>
                            )}
                            {metadata.interviewee_names && (
                                <div className="metadata-item">
                                    <span className="metadata-label">Interviewee(s)</span>
                                    <span className="metadata-value">{metadata.interviewee_names}</span>
                                </div>
                            )}
                            {metadata.language && (
                                <div className="metadata-item">
                                    <span className="metadata-label">Language</span>
                                    <span className="metadata-value">{metadata.language}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TranscriptDetails;