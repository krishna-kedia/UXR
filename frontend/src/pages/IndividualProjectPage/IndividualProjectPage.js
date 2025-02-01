import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TranscriptDetails from '../../components/TranscriptDetails/TranscriptDetails';
import QuestionBox from '../../components/QuestionBox/QuestionBox';
import './IndividualProjectPage.css';
import CreateQuestionOverlay from '../../components/CreateQuestionOverlay/CreateQuestionOverlay';
import axios from 'axios';
import UploadOptionsMenu from '../../components/UploadOptionsMenu/UploadOptionsMenu';

import Loader from '../../components/Loader/Loader';

function IndividualProjectPage() {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [transcripts, setTranscripts] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [questions, setQuestions] = useState([]);
    const [showOverlay, setShowOverlay] = useState(false);
    const [showBotDialog, setShowBotDialog] = useState(false);
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [uploadingTranscripts, setUploadingTranscripts] = useState([]);

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
            setIsLoading(true);
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
            console.log(projectData, "project data")
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
            console.log(transcriptData, "transcript data")

            const formattedTranscripts = transcriptData.map(transcript => ({
                _id: transcript._id,
                name: transcript.transcriptName,
                uploadedOn: new Date(transcript.createdAt).toLocaleDateString(),
                metadata: transcript.metadata,
                origin: transcript.origin
            }));

            setTranscripts(formattedTranscripts);
            console.log(formattedTranscripts, "formatted transcripts")

            // Store project details in local storage
            const projectDetails = {
                projectName: projectData.projectName,
                numberOfTranscripts: transcriptData.length,
                createdAt: projectData.createdAt,
                questionsCreatedDateTime: projectData.questionsCreatedDateTime
            };

        } catch (error) {
            showMessage(error.message, true);
        } finally {
            setIsLoading(false);
        }
    };

    const validateFile = (file) => {
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File size exceeds 50MB limit');
        }

        // if (!ALLOWED_TYPES[file.type]) {
        //     throw new Error('Invalid file type. Only MP3, MP4, WAV, PDF, DOCX, and TXT files are allowed frontned ');
        // }

        return true;
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

    // Load any in-progress uploads on mount
    useEffect(() => {
        const inProgressUploads = JSON.parse(localStorage.getItem(`uploading_transcripts_${projectId}`)) || [];
        setUploadingTranscripts(inProgressUploads);
    }, [projectId]);

    // Update localStorage when uploadingTranscripts changes
    useEffect(() => {
        localStorage.setItem(`uploading_transcripts_${projectId}`, JSON.stringify(uploadingTranscripts));
    }, [uploadingTranscripts, projectId]);

    const handleSubmit = async (formData) => {
        setError('');

        try {
            if (formData.type === 'upload') {
                await handleFileUpload(formData.data);
            } else {
                await handleBotInvite(formData.data);
            }
        } catch (error) {
            setError(error.message);
            // Remove failed upload from uploading state
            setUploadingTranscripts(prev => 
                prev.filter(t => t.tempId !== formData.tempId)
            );
        }
    };

    const handleFileUpload = async (data) => {
        // Create temporary transcript with metadata
        const tempTranscript = {
            tempId: Date.now().toString(),
            transcriptName: data.transcriptName,
            fileName: data.file.name,
            isUploading: true,
            metadata: data.metadata
        };

        setUploadingTranscripts(prev => [...prev, tempTranscript]);

        const formData = new FormData();
        formData.append('transcript', data.file);
        formData.append('transcriptName', data.transcriptName);
        formData.append('no_of_people', data.metadata.no_of_people);
        formData.append('interviewer_name', data.metadata.interviewer_name);
        formData.append('interviewee_names', data.metadata.interviewee_names);
        formData.append('language', data.metadata.language);
        formData.append('projectId', projectId);
        formData.append('userId', localStorage.getItem('userId'));

        const response = await fetch('http://localhost:5001/api/transcripts/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        // Remove temp transcript on success
        setUploadingTranscripts(prev => 
            prev.filter(t => t.tempId !== tempTranscript.tempId)
        );
        
        setSuccess('File uploaded successfully!');
        setDialogOpen(false);
        fetchProjectDetails(); // Refresh the list
    };

    const handleBotInvite = async (data) => {
        const response = await fetch('http://localhost:5001/api/bot/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                meetingLink: data.meetingLink,
                meetingName: data.meetingName,
                projectId: projectId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to invite bot');
        }

        setSuccess('Bot invited successfully!');
        setDialogOpen(false);
        fetchProjectDetails(); // Refresh the list
    };

    return (
        <div className="project-detail-container">
            {isLoading ? (
                <div className="loader-container">
                    <Loader />
                </div>
            ) : (
                <div className='project-chat-container'>
                
                </div>
            )}
            <div className="project-detail-header">
                <button className="back-btn" onClick={() => navigate('/projects')}>
                    ← Back to Projects
                </button>
                <div className="project-info">
                    <h1>{projectName}</h1>
                    <button 
                        className="upload-btn"
                        onClick={() => setDialogOpen(true)}
                        disabled={isLoading}
                    >
                        Add new transcript
                    </button>
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


               <div className="transcript_container">
                {/* Show uploading transcripts first */}
                {uploadingTranscripts.map(transcript => (
                    <TranscriptDetails
                        key={transcript.tempId}
                        transcript={{
                            ...transcript,
                            isUploading: true
                        }}
                    />
                ))}
                {/* Show regular transcripts */}
                {transcripts.map((transcript) => (
                    <TranscriptDetails
                        key={transcript._id}
                        transcript={transcript}
                        onDelete={fetchProjectDetails}
                    />
                ))}
            </div>


           

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

            {/* {showBotDialog && (
                <InviteBotDialog
                    open={showBotDialog}
                    onClose={() => setShowBotDialog(false)}
                    projectId={projectId}
                />
            )} */}

            <UploadOptionsMenu
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleSubmit}
                error={error}
            />
        </div>
    );
}

export default IndividualProjectPage;