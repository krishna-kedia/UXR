import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TranscriptDetails from '../../components/TranscriptDetails/TranscriptDetails';
import QuestionBox from '../../components/QuestionBox/QuestionBox';
import './IndividualProjectPage.css';
import CreateQuestionOverlay from '../../components/CreateQuestionOverlay/CreateQuestionOverlay';
import axios from 'axios';

function IndividualProjectPage() {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [transcripts, setTranscripts] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [questions, setQuestions] = useState([]);
    const [showOverlay, setShowOverlay] = useState(false);
    const { projectId } = useParams();
    const navigate = useNavigate();

    // Maximum file size (50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    const ALLOWED_TYPES = {
        'audio/mpeg': 'mp3',
        'audio/mp4': 'mp4',
        'audio/wav': 'wav',
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/plain': 'txt'
    };

    const showMessage = (message, isError = false) => {
        if (isError) {
            setError(message);
            setTimeout(() => setError(null), 5000);
        } else {
            setSuccess(message);
            setTimeout(() => setSuccess(null), 5000);
        }
    };

    const fetchProjectDetails = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch project details');
            }
            
            const projectData = await response.json();
            setProjectName(projectData.projectName);
            
            // Fetch transcripts for this project
            const transcriptResponse = await fetch(`http://localhost:5001/api/transcripts/project/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!transcriptResponse.ok) {
                throw new Error('Failed to fetch transcripts');
            }

            const transcriptData = await transcriptResponse.json();

            const formattedTranscripts = transcriptData.map(transcript => ({
                _id: transcript._id,
                name: transcript.transcriptName,
                uploadedOn: new Date(transcript.createdAt).toLocaleDateString(),
                content: transcript.content
            }));

            setTranscripts(formattedTranscripts);

            // Store project details in local storage
            const projectDetails = {
                projectName: projectData.projectName,
                numberOfTranscripts: transcriptData.length,
                createdAt: projectData.createdAt,
                questionsCreatedDateTime: projectData.questionsCreatedDateTime
            };
            localStorage.setItem('projectDetails', JSON.stringify(projectDetails));

        } catch (error) {
            showMessage(error.message, true);
        }
    };

    const validateFile = (file) => {
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File size exceeds 50MB limit');
        }

        if (!ALLOWED_TYPES[file.type]) {
            throw new Error('Invalid file type. Only MP3, MP4, WAV, PDF, DOCX, and TXT files are allowed');
        }

        return true;
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            validateFile(file);
            setIsUploading(true);
            setError(null);
            
            const formData = new FormData();
            formData.append('transcript', file);
            formData.append('transcriptName', file.name);

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

            // Link transcript to project
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
                throw new Error('Failed to link transcript to project');
            }

            showMessage('Transcript uploaded and added to project successfully!');
            fetchProjectDetails();

        } catch (error) {
            showMessage(error.message, true);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const handleGenerateQuestions = async () => {
        setShowOverlay(true);
        // try {
        //     const response = await fetch('http://127.0.0.1:8000/generate-questions/', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json'
        //         },
        //         body: JSON.stringify({ project_id: projectId })
        //     });

        //     if (!response.ok) {
        //         throw new Error('Failed to generate questions');
        //         console.log(response);
        //     }

        //     const data = await response.json();
        //     setQuestions(Object.values(data));
        // } catch (error) {
        //     showMessage('Failed to generate questions', true);
        // }
    };

    const handleQuestionChange = (index, newText) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = newText;
        setQuestions(updatedQuestions);
    };

    const handleSaveQuestions = async (questionsToSave) => {
        try {
            const response = await fetch('http://localhost:5001/api/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    questions: questionsToSave, 
                    projectId 
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save questions');
            }

            showMessage('Questions saved successfully!');
            setShowOverlay(false);
            // Refresh project details and navigate
            await fetchProjectDetails();
            navigate(`/project/${projectId}`);
        } catch (error) {
            showMessage('Failed to save questions', true);
        }
    };

    useEffect(() => {
        fetchProjectDetails();
    }, [projectId]);

    return (
        <div className="project-detail-container">
            <div className="project-detail-header">
                <div className="back-button">
                    <button 
                        className="back-btn" 
                        onClick={() => navigate('/projects')}
                    >
                        ← Back to Projects
                    </button>
                </div>
                <div className="project-info">
                    <h1>{projectName}</h1>
                    <button 
                        className="upload-btn" 
                        onClick={handleUploadClick}
                        disabled={isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Add new transcript'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept=".mp3,.mp4,.wav,.pdf,.docx,.txt"
                    />
                </div>
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

            <div className="transcripts-table" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                                onDelete={fetchProjectDetails}
                            />
                        ))
                    ) : (
                        <div className="no-transcripts">
                            No transcripts available
                        </div>
                    )}
                </div>
            </div>

            <button 
                className="generate-questions-btn" 
                onClick={() => setShowOverlay(true)}
                //onClick={handleGenerateQuestions}
                title="this is a sample tooltip"
            >
                Generate Questions
            </button>

            {showOverlay && (
                <CreateQuestionOverlay 
                    onClose={() => setShowOverlay(false)} 
                    projectId={projectId}
                    onSave={handleSaveQuestions}
                />
            )}

            {questions.map((question, index) => (
                <QuestionBox 
                    key={index} 
                    question={question} 
                    onChange={(newText) => handleQuestionChange(index, newText)} 
                />
            ))}

            {questions.length > 0 && (
                <button className="save-questions-btn" onClick={handleSaveQuestions}>
                    Save Questions
                </button>
            )}
        </div>
    );
}

export default IndividualProjectPage;