import React, { useState, useRef } from 'react';
import TranscriptDetails from '../../components/TranscriptDetails/TranscriptDetails';
import './HomePage.css';

function HomePage() {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [transcripts, setTranscripts] = useState([]);
    const fileInputRef = useRef(null);

    // Maximum file size (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/plain': 'txt'
    };

    const showMessage = (message, isError = false) => {
        if (isError) {
            setError(message);
            setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
        } else {
            setSuccess(message);
            setTimeout(() => setSuccess(null), 5000); // Clear success after 5 seconds
        }
    };

    const fetchTranscripts = async () => {
        try {
            // First, fetch project to get transcript IDs
            const projectId = "67757ec53efd8fe57faa0823";
            console.log('Fetching project:', projectId);
    
            const projectResponse = await fetch(`http://localhost:5001/api/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!projectResponse.ok) {
                console.error('Project response status:', projectResponse.status);
                const errorData = await projectResponse.json();
                console.error('Project error:', errorData);
                throw new Error('Failed to fetch project');
            }
            
            const projectData = await projectResponse.json();
            console.log('Project data:', projectData);
            
            if (!projectData.transcripts || projectData.transcripts.length === 0) {
                setTranscripts([]);
                return;
            }

            // Then fetch details for each transcript
            const transcriptResponse = await fetch(`http://localhost:5001/api/transcripts/project/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!transcriptResponse.ok) {
                console.error('Transcript response status:', transcriptResponse.status);
                const errorData = await transcriptResponse.json();
                console.error('Transcript error:', errorData);
                throw new Error('Failed to fetch transcripts');
            }

            const transcriptData = await transcriptResponse.json();
            console.log('Transcript data:', transcriptData);

            // Format the transcript data for display
            const formattedTranscripts = transcriptData.map(transcript => ({
                _id: transcript._id,
                name: transcript.transcriptName,
                uploadedOn: new Date(transcript.createdAt).toLocaleDateString(),
                content: transcript.content
            }));

            setTranscripts(formattedTranscripts);

        } catch (error) {
            console.error('Detailed error:', error);
            showMessage('Failed to fetch transcripts', true);
        }
    };

    const validateFile = (file) => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File size exceeds 5MB limit');
        }

        // Check file type
        if (!ALLOWED_TYPES[file.type]) {
            throw new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed');
        }

        return true;
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            validateFile(file);
            setIsUploading(true);
            setError(null);
            
            // Create FormData
            const formData = new FormData();
            formData.append('transcript', file);
            formData.append('transcriptName', file.name);

            // Upload transcript
            const uploadResponse = await fetch('http://localhost:5001/api/transcripts/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData
            });

            const uploadData = await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(uploadData.error || 'Upload failed');
            }

            // Update project with new transcript ID
            const projectId = "67757ec53efd8fe57faa0823"; // Hardcoded project ID
            const updateResponse = await fetch(`http://localhost:5001/api/projects/${projectId}/transcripts`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    transcriptId: uploadData.transcript.id
                })
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update project with new transcript');
            }

            showMessage('Transcript uploaded and added to project successfully!');
            fetchTranscripts();

        } catch (error) {
            showMessage(error.message, true);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    // Fetch transcripts when component mounts
    React.useEffect(() => {
        fetchTranscripts();
    }, []);

    return (
        <div className="home-container">
            <div className="home-header">
                <h1>Transcripts</h1>
                <button 
                    className="upload-btn" 
                    onClick={handleUploadClick}
                    disabled={isUploading}
                >
                    {isUploading ? 'Uploading...' : 'Upload New'}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    accept=".txt,.doc,.docx,.pdf"
                />
            </div>

            {error && (
                <div className="message error-message">
                    {error}
                </div>
            )}
            {success && (
                <div className="message success-message">
                    {success}
                </div>
            )}

            <div className="transcripts-table">
                <div className="table-header">
                    <div className="header-name">Name</div>
                    <div className="header-date">Uploaded On</div>
                </div>
                
                <div className="table-content">
                    {transcripts.length > 0 ? (
                        transcripts.map((transcript) => (
                            <TranscriptDetails
                                key={transcript._id}
                                transcript={transcript}
                                onDelete={fetchTranscripts}
                            />
                        ))
                    ) : (
                        <div className="no-transcripts">
                            No transcripts available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HomePage;