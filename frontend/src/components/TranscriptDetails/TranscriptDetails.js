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
        metadata
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