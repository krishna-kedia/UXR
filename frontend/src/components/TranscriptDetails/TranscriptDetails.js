import React from 'react';
import './TranscriptDetails.css';

const TranscriptDetails = ({ transcript }) => {
    return (
        <div className="transcript-row">
            <div className="transcript-name">{transcript.name}</div>
            <div className="transcript-date">{transcript.uploadedOn}</div>
        </div>
    );
};

export default TranscriptDetails;