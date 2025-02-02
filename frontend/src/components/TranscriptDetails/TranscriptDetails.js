import React, { useState } from 'react';
import { Videocam, Person } from '@mui/icons-material'; // Using MUI icons
import './TranscriptDetails.css';
import image from './images.jpeg'


const TranscriptDetails = ({   
    transcript: { 
        _id,  // Need this for reprocessing
        name, 
        origin, 
        imageUrl = image,
        transcriptName,
        metadata,
        botStatus,
        createdAt,
        uploadStatus: initialUploadStatus,
        progress
    } 
}) => {
    const [uploadStatus, setUploadStatus] = useState(initialUploadStatus);  // Add state

    const handleReprocess = async () => {
        try {
            await fetch(`http://localhost:5001/api/transcripts/process-transcript/${_id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            setUploadStatus('PROCESSING');
        } catch (error) {
            console.error('Failed to reprocess:', error);
        }
    };

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
            case 'INITIATING': return 'status-initiating';
            case 'UPLOADING': return 'status-uploading';
            case 'UPLOAD_COMPLETED': return 'status-upload-completed';
            case 'PROCESSING': return 'status-processing';
            case 'PROCESSING_FAILED': return 'status-failed';
            case 'READY_TO_USE': return 'status-ready';
            default: return 'status-default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'INITIATING': return 'Initiating Upload';
            case 'UPLOADING': return 'Uploading';
            case 'UPLOAD_COMPLETED': return 'Upload Complete';
            case 'PROCESSING': return 'Processing';
            case 'PROCESSING_FAILED': return 'Processing Failed';
            case 'READY_TO_USE': return 'Ready';
            default: return status?.replace(/_/g, ' ');
        }
    };

    return (
        <div className="transcript-card">
            <div className="transcript-image">
                <img src={imageUrl} alt={transcriptName} />
            </div>
            <div className="transcript-content">
                <div className="transcript-header">
                    <h3 className="transcript-name">
                        {transcriptName || name}
                    </h3>
                    
                    <div className="status-container">
                    <span className={`status-tag ${getStatusColor(uploadStatus)}`}>
                        {getStatusText(uploadStatus)}
                    </span>
                    {getOriginIcon(origin)}
                </div>
                
                </div>
                {origin === 'meeting_recording' && botStatus && botStatus.status && (
                    <div className={`status-badge ${getStatusColor(botStatus.status.code)}`}>
                        {botStatus.status.code.replace(/_/g, ' ')}
                    </div>
                )}
                <div className="status-container">
                    {uploadStatus === 'PROCESSING_FAILED' && (
                        <button 
                            className="process-again-btn"
                            onClick={handleReprocess}
                        >
                            Process Again
                        </button>
                    )}
                </div>
                <div className="transcript-metadata">
                    {metadata && (
                        <div className="metadata-grid">
                            {metadata.no_of_people && (
                                <div className="metadata-item">
                                    <span className="metadata-label">Participants</span>
                                    <span className="metadata-value">{metadata.no_of_people}</span>
                                </div>
                            )}
                            {metadata.language && (
                                <div className="metadata-item">
                                    <span className="metadata-label">Language</span>
                                    <span className="metadata-value">{metadata.language}</span>
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TranscriptDetails;