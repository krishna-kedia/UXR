import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TranscriptDetails from '../../components/TranscriptDetails/TranscriptDetails';
import QuestionBox from '../../components/QuestionBox/QuestionBox';
import './IndividualProjectPage.css';
import CreateQuestionOverlay from '../../components/CreateQuestionOverlay/CreateQuestionOverlay';
import axios from 'axios';
import UploadOptionsMenu from '../../components/UploadOptionsMenu/UploadOptionsMenu';
import Alert from '../../components/Alert/Alert';
import Loader from '../../components/Loader/Loader';
import HandleQuestionOverlay from '../../components/HandleQuestionOverlay/HandleQuestionOverlay';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

function IndividualProjectPage() {
    const [transcripts, setTranscripts] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [showOverlay, setShowOverlay] = useState(false);
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [uploadingTranscripts, setUploadingTranscripts] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadingTranscriptNames, setUploadingTranscriptNames] = useState({});
    const [alert, setAlert] = useState(null);
    const [project, setProject] = useState({});
    const [showQuestionOverlay, setShowQuestionOverlay] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingTranscript, setEditingTranscript] = useState(null);
    const [transcriptToDelete, setTranscriptToDelete] = useState(null);

    const showAlert = (message, type) => {
        setAlert({ message, type });
    };

    const fetchProjectDetails = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch project details');
            }
            
            const projectData = await response.json();
            setProject(projectData);
            sessionStorage.setItem('projectData', JSON.stringify(projectData));

            // Format transcripts from project data
            const formattedTranscripts = projectData.transcripts.map(transcript => ({
                _id: transcript._id,
                name: transcript.transcriptName,
                uploadedOn: new Date(transcript.createdAt).toLocaleDateString(),
                metadata: transcript.metadata,
                origin: transcript.origin,
                bot_session_id: transcript.bot_session_id,
                uploadStatus: transcript.uploadStatus,
                progress: transcript.progress,
                createdAt: transcript.createdAt,
                s3Url: transcript.s3Url
            }));

            // Get bot statuses for meeting recordings
            const meetingRecordings = formattedTranscripts.filter(t => 
                t.origin === 'meeting_recording' && t.bot_session_id
            );

            setTranscripts(formattedTranscripts);

        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuestionChange = (index, newText) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = newText;
        setQuestions(updatedQuestions);
    };

    const handleSaveQuestions = async (questionsToSave) => {
        try {
            const response = await fetch('/api/questions', {
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

            showAlert('Questions saved successfully!', 'success');
            setShowOverlay(false);
            // Refresh project details and navigate
            await fetchProjectDetails();
            navigate(`/project/${projectId}`);
        } catch (error) {
            showAlert('Failed to save questions', 'error');
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
        try {
            if (formData.type === 'upload') {
                await handleFileUpload(formData.data);
            } else {
                await handleBotInvite(formData.data);
            }
        } catch (error) {
            showAlert(error.message, 'error');
            // Remove failed upload from uploading state
            setUploadingTranscripts(prev => 
                prev.filter(t => t.tempId !== formData.tempId)
            );
        }
    };

    const handleFileUpload = async (data) => {
        let uploadId = null;
        let transcriptId = null;
        let s3Key = null;
        const MAX_RETRIES = 2;
        const RETRY_DELAY = 1000;
        const CHUNK_SIZE = 5 * 1024 * 1024;
            
        const validateETag = (eTag, partNumber) => {
            if (!eTag) {
                console.error(`Invalid ETag for part ${partNumber}: ETag is empty`);
                return false;
            }
            if (typeof eTag !== 'string') {
                console.error(`Invalid ETag type for part ${partNumber}:`, typeof eTag);
                return false;
            }
            return true;
        };

        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const uploadPartWithRetry = async (partNumber, chunk, attempt = 1) => {
            try {
                console.log(`[Part ${partNumber}] Starting upload attempt ${attempt}/${MAX_RETRIES}`, {
                    size: chunk.size,
                    start: chunk.size * (partNumber - 1),
                    end: chunk.size * partNumber
                });
                
                const urlResponse = await fetch(
                    `/api/transcripts/upload-part-url?uploadId=${uploadId}&partNumber=${partNumber}&s3Key=${s3Key}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
                
                if (!urlResponse.ok) {
                    const errorText = await urlResponse.text();
                    console.error(`[Part ${partNumber}] Failed to get signed URL:`, errorText);
                    throw new Error('Failed to get upload URL');
                }

                const { signedUrl } = await urlResponse.json();


                const uploadResponse = await fetch(signedUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': data.file.type,
                        'Content-Length': chunk.size.toString(),
                    },
                    body: chunk
                });

                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text();
                    console.error(`[Part ${partNumber}] Upload failed:`, {
                        status: uploadResponse.status,
                        statusText: uploadResponse.statusText,
                        error: errorText
                    });
                    throw new Error(`Failed to upload part ${partNumber}`);
                }

                const rawETag = uploadResponse.headers.get('ETag');

                
                if (!rawETag) {
                    throw new Error(`No ETag received for part ${partNumber}`);
                }
                
                return rawETag;  // Return with quotes intact

            } catch (error) {
                console.error(`[Part ${partNumber}] Error:`, error);
                if (attempt < MAX_RETRIES) {
                    const delayTime = RETRY_DELAY * attempt;
                    await wait(delayTime);
                    return uploadPartWithRetry(partNumber, chunk, attempt + 1);
                }
                throw error;
            }
        };

        const completeUploadWithRetry = async (parts, attempt = 1) => {
            try {
                const invalidParts = parts.filter(p => !validateETag(p.ETag, p.PartNumber));
                if (invalidParts.length > 0) {
                    throw new Error('Invalid ETags detected in parts');
                }

                const completeResponse = await fetch('/api/transcripts/complete-upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        transcriptId: transcriptId,
                        parts: parts
                    })
                });

                const responseData = await completeResponse.json();
                
                if (!completeResponse.ok) {
                    throw new Error(responseData.error || 'Failed to complete upload');
                }

                return responseData; // Return on success

            } catch (error) {
                if (attempt < MAX_RETRIES) {
                    const delayTime = RETRY_DELAY * attempt;
                    await wait(delayTime);
                    return completeUploadWithRetry(parts, attempt + 1);
                }
                throw error;
            }
        };

        // First try-catch: Handle the upload process
        try {
            setIsLoading(true);
            const initiateResponse = await fetch('/api/transcripts/initiate-upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileName: data.file.name,
                    fileType: data.file.type,
                    fileSize: data.file.size,
                    projectId,
                    transcriptName: data.transcriptName,
                    metadata: data.metadata
                })
            });

            if (!initiateResponse.ok) {
                throw new Error('Failed to initiate upload');
            }

            const initData = await initiateResponse.json();
            uploadId = initData.uploadId;
            transcriptId = initData.transcriptId;
            s3Key = initData.s3Key;
            const numberOfParts = initData.numberOfParts;
            setIsLoading(false);

            setUploadProgress(prev => ({
                ...prev,
                [transcriptId]: 0
            }));
            setUploadingTranscriptNames(prev => ({
                ...prev,
                [transcriptId]: data.transcriptName
            }));

            const uploadedParts = [];

            for (let partNumber = 1; partNumber <= numberOfParts; partNumber++) {
                const start = (partNumber - 1) * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, data.file.size);
                const chunk = data.file.slice(start, end);

                const eTag = await uploadPartWithRetry(partNumber, chunk);
                
                const progress = Math.round((partNumber / numberOfParts) * 100);
                setUploadProgress(prev => ({
                    ...prev,
                    [transcriptId]: progress
                }));

                uploadedParts.push({
                    PartNumber: partNumber,
                    ETag: eTag
                });
            }

            await completeUploadWithRetry(uploadedParts);
            
            // Clear progress after upload completes
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[transcriptId];
                return newProgress;
            });
            setUploadingTranscriptNames(prev => {
                const newNames = { ...prev };
                delete newNames[transcriptId];
                return newNames;
            });

            showAlert(`${data.transcriptName} upload complete`, 'success');
            setTimeout(() => {
                fetchProjectDetails();
            }, 3000);

        } catch (error) {
            if (uploadId || s3Key || transcriptId) {
                try {
                    await fetch('/api/transcripts/abort-upload', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            uploadId, 
                            s3Key,
                            transcriptId,
                            projectId,
                            deleteFromS3: true
                        })
                    });
                } catch (abortError) {
                    // Silently handle abort error
                }
            }
            setIsLoading(false);
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[transcriptId];
                return newProgress;
            });
            setUploadingTranscriptNames(prev => {
                const newNames = { ...prev };
                delete newNames[transcriptId];
                return newNames;
            });
            showAlert(`${data.transcriptName} upload failed`, 'error');
            setTimeout(() => {
                fetchProjectDetails();
            }, 3000);
            return;
        }

        // Step 1: Transcribe the file
        try {
            const transcribeResponse = await fetch(`/api/transcripts/transcribe/${transcriptId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!transcribeResponse.ok) {
                throw new Error(`Failed to transcribe: ${data.transcriptName}`);
            }

            showAlert(`${data.transcriptName} transcription started`, 'success');
            setTimeout(() => {
                fetchProjectDetails();
            }, 3000);

        } catch (error) {
            showAlert(`Transcription failed: ${error.message}`, 'error');
            setTimeout(() => {
                fetchProjectDetails();
            }, 3000);
            return; // Exit early if transcription fails
        }

        // Step 2: Generate questions
        try {
            const questionsResponse = await fetch(`/api/transcripts/generate-transcript-questions/${transcriptId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!questionsResponse.ok) {
                throw new Error(`Failed to generate questions for: ${data.transcriptName}`);
            }

            showAlert(`${data.transcriptName} questions generated successfully`, 'success');
            setTimeout(() => {
                fetchProjectDetails();
            }, 3000);

        } catch (error) {
            showAlert(`Question generation failed: ${error.message}`, 'error');
            setTimeout(() => {
                fetchProjectDetails();
            }, 3000);
        }
    };

    const handleBotInvite = async (data) => {
        const response = await fetch('/api/bot/create', {
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

        showAlert('Bot invited successfully!', 'success');
        setDialogOpen(false);
        fetchProjectDetails();
    };
    const hasTranscripts = project.transcripts && project.transcripts.length > 0 && project.transcripts.some(transcript => transcript.uploadStatus === 'READY_TO_USE');

    const handleEditTranscript = (transcript) => {
        setEditingTranscript(transcript);
        setEditDialogOpen(true);
    };

    const handleUpdateTranscript = async () => {
        try {
            const response = await fetch(`/api/transcripts/${editingTranscript._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transcriptName: editingTranscript.transcriptName,
                    metadata: editingTranscript.metadata
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update transcript');
            }

            showAlert('Transcript updated successfully', 'success');
            setEditDialogOpen(false);
            fetchProjectDetails();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };

    const handleDeleteTranscript = (transcriptId) => {
        const transcript = transcripts.find(t => t._id === transcriptId);
        setTranscriptToDelete(transcript);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await fetch(`/api/transcripts/${transcriptToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete transcript');
            }

            showAlert('Transcript deleted successfully', 'success');
            setDeleteDialogOpen(false);
            fetchProjectDetails();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };

    return (
        <>
            {isLoading ? (
                <div className="loader-container">
                    <Loader />
                </div>
            ) : (
                <div className="project-detail-container">
                    {alert && (
                        <Alert
                            type={alert.type}
                            message={alert.message}
                            onClose={() => setAlert(null)}
                        />
                    )}
                    
                    <div className="project-detail-header">
                        <div className="project-info">
                            <h1>{project.projectName}</h1>
                            <button 
                                className="upload-btn"
                                onClick={() => setDialogOpen(true)}
                                disabled={isLoading}
                            >
                                Add new transcript
                            </button>
                        </div>
                    </div>

                    {/* Upload Progress */}
                    {Object.keys(uploadProgress).length > 0 && (
                        <div className="upload-progress-container">
                            <div className="upload-label">
                                {Object.values(uploadProgress)[0] === 100 
                                    ? `Transcribing and processing ${uploadingTranscriptNames[Object.keys(uploadProgress)[0]]}. This might take some time...`
                                    : `Uploading ${uploadingTranscriptNames[Object.keys(uploadProgress)[0]]}...`
                                }
                            </div>
                            <div className="progress-bar-wrapper">
                                <div 
                                    className="progress-bar-fill"
                                    style={{ 
                                        width: `${Object.values(uploadProgress)[0]}%`,
                                        backgroundColor: Object.values(uploadProgress)[0] === 100 ? '#22C55E' : '#EAB308' // Green if 100%, Yellow otherwise
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="project-content">
                        <div className="transcripts-section">
                                {transcripts.map((transcript) => (
                                    <TranscriptDetails
                                        key={transcript._id}
                                        transcript={{
                                            ...transcript,
                                            progress: uploadProgress[transcript._id] || 0,
                                            uploadStatus: transcript.uploadStatus
                                        }}
                                        onDelete={handleDeleteTranscript}
                                        onEdit={handleEditTranscript}
                                    />
                                ))}
                        </div>

                        <div className="questions-section">
                            <CreateQuestionOverlay 
                                projectId={projectId}
                                onSave={handleSaveQuestions}
                                questionsCreatedDateTime={project.questionsCreatedDateTime}
                                existingQuestions={project.questions}
                                hasTranscripts={hasTranscripts}
                                project={project}
                            />
                        </div>
                    </div>

                    <UploadOptionsMenu
                        open={dialogOpen}
                        onClose={() => setDialogOpen(false)}
                        onSubmit={handleSubmit}
                    />

                    {/* Edit Dialog */}
                    <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                        <DialogTitle>Edit Transcript</DialogTitle>
                        <DialogContent>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Transcript Name"
                                type="text"
                                fullWidth
                                value={editingTranscript?.transcriptName || ''}
                                onChange={(e) => setEditingTranscript(prev => ({
                                    ...prev,
                                    transcriptName: e.target.value
                                }))}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateTranscript} variant="contained">Save</Button>
                        </DialogActions>
                    </Dialog>

                    {/* Delete Dialog */}
                    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                        <DialogTitle>Delete Transcript?</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Are you sure you want to delete "{transcriptToDelete?.transcriptName}"? 
                                This action cannot be undone and will permanently delete the transcript and all associated data.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleConfirmDelete} color="error" variant="contained">
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            )}
        </>
    );
}

export default IndividualProjectPage;