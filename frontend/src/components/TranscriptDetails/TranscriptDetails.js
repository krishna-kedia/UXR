import React, { useState } from 'react';
import { Videocam, Person } from '@mui/icons-material'; // Using MUI icons
import './TranscriptDetails.css';
import image from './images.jpeg'

const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    // Less than a minute
    if (diffInSeconds < 60) {
        return 'just now';
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
    
    // Less than a month
    if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks}w ago`;
    }
    
    // Less than a year
    if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months}mo ago`;
    }
    
    // More than a year
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years}y ago`;
};

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
        progress,
        s3Url
    } 
}) => {
    const [uploadStatus, setUploadStatus] = useState(initialUploadStatus);  // Add state

    const handleReprocess = async () => {
        // Step 1: Transcribe
        setUploadStatus('PROCESSING');
        
        console.log({_id}, "transcript id");
        const transcriptId = {_id}._id
        try {
            const transcribeResponse = await fetch(`http://localhost:5001/api/transcripts/transcribe/${transcriptId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileUrl: 's3Url',
                    transcribeMethod: 'aws',
                    transcribeLang: 'en-US',
                    transcribeSpeakerNumber: 2
                })
            });
            if (!transcribeResponse.ok) {
                setUploadStatus('PROCESSING_FAILED');
                throw new Error('Transcription failed');
            }
            setUploadStatus('PROCESSED');
        } catch (error) {
            console.error('Failed to transcribe:', error);
            setUploadStatus('PROCESSING_FAILED');
            return;
        }

        // Step 2: Generate Questions
        try {
            setUploadStatus('GENERATING_QUESTIONS');
            const questionsResponse = await fetch(`http://localhost:5001/api/transcripts/generate-transcript-questions/${_id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!questionsResponse.ok) {
                setUploadStatus('QUESTION_GENERATION_FAILED');
                throw new Error('Question generation failed');
            }
            setUploadStatus('READY_TO_USE');
        } catch (error) {
            console.error('Failed to generate questions:', error);
            setUploadStatus('QUESTION_GENERATION_FAILED');
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
                <div className="transcript-details-header">
                    <h3 className="transcript-name">
                        {transcriptName || name}
                    </h3>
                    <span className="created-at">
                        Created {formatTimeAgo(createdAt)}
                    </span>
                </div>

                <div className="status-row">
                    <Person className="user-icon" />
                    <span className={`status-tag ${getStatusColor(uploadStatus)}`}>
                        {getStatusText(uploadStatus)}
                    </span>
                </div>

                <div className="metadata-row">
                    {metadata && (
                        <>
                            {metadata.no_of_people && (
                                <span className="metadata-item">
                                    Participants: {metadata.no_of_people}
                                </span>
                            )}
                            {metadata.language && (
                                <>
                                    <span className="separator">|</span>
                                    <span className="metadata-item">
                                        Language: {metadata.language}
                                    </span>
                                </>
                            )}
                            {metadata.interviewer_name && (
                                <>
                                    <span className="separator">|</span>
                                    <span className="metadata-item">
                                        Interviewer: {metadata.interviewer_name}
                                    </span>
                                </>
                            )}
                        </>
                    )}
                </div>

                {metadata?.interviewee_names && (
                    <div className="interviewee-row">
                        Interviewee(s): {metadata.interviewee_names}
                    </div>
                )}

                {uploadStatus === 'PROCESSING_FAILED' && (
                    <button 
                        className="process-again-btn"
                        onClick={handleReprocess}
                    >
                        Process again
                    </button>
                )}
            </div>
        </div>
    );
};

export default TranscriptDetails;