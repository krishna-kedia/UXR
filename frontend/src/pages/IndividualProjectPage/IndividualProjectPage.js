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

    const showAlert = (message, type) => {
        setAlert({ message, type });
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
                createdAt: transcript.createdAt
            }));

            // Get bot statuses for meeting recordings
            const meetingRecordings = formattedTranscripts.filter(t => 
                t.origin === 'meeting_recording' && t.bot_session_id
            );

            console.log('Meeting recordings:', meetingRecordings); // Debug log
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
        console.log(questionsToSave);
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
                    `http://localhost:5001/api/transcripts/upload-part-url?uploadId=${uploadId}&partNumber=${partNumber}&s3Key=${s3Key}`,
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
                console.log(`[Part ${partNumber}] Got signed URL, length: ${signedUrl.length}`);

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
                console.log(`[Part ${partNumber}] Raw ETag from S3:`, rawETag);
                
                if (!rawETag) {
                    throw new Error(`No ETag received for part ${partNumber}`);
                }

                // Store the ETag exactly as received from S3, no modification needed
                console.log(`[Part ${partNumber}] Using ETag:`, rawETag);
                
                return rawETag;  // Return with quotes intact

            } catch (error) {
                console.error(`[Part ${partNumber}] Error:`, error);
                if (attempt < MAX_RETRIES) {
                    const delayTime = RETRY_DELAY * attempt;
                    console.log(`[Part ${partNumber}] Waiting ${delayTime}ms before retry`);
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

                const completeResponse = await fetch('http://localhost:5001/api/transcripts/complete-upload', {
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
            const initiateResponse = await fetch('http://localhost:5001/api/transcripts/initiate-upload', {
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
                    await fetch('http://localhost:5001/api/transcripts/abort-upload', {
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

        // Second try-catch: Handle the processing
        try {
            const processResponse = await fetch(`http://localhost:5001/api/transcripts/process-transcript/${transcriptId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!processResponse.ok) {
                throw new Error(`Failed to process transcript: ${data.transcriptName}`);
            }

            showAlert(`${data.transcriptName} processing started`, 'success');
            setTimeout(() => {
                fetchProjectDetails();
            }, 3000);

        } catch (error) {
            showAlert(error.message, 'error');
            setTimeout(() => {
                fetchProjectDetails();
            }, 3000);
        }
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

        showAlert('Bot invited successfully!', 'success');
        setDialogOpen(false);
        fetchProjectDetails();
    };

    // useEffect(() => {
    //     const pollBotStatuses = async () => {
    //         const meetingRecordings = transcripts.filter(t => 
    //             t.origin === 'meeting_recording' && t.bot_session_id
    //         );

    //         if (meetingRecordings.length === 0) return;

    //         const botStatuses = await Promise.all(
    //             meetingRecordings.map(async (transcript) => {
    //                 try {
    //                     const response = await fetch(`http://localhost:5001/api/bot/status/${transcript.bot_session_id}`, {
    //                         headers: {
    //                             'Authorization': `Bearer ${localStorage.getItem('token')}`
    //                         }
    //                     });
                        
    //                     if (!response.ok) return [transcript._id, null];
                        
    //                     const botData = await response.json();
    //                     return [transcript._id, botData];
    //                 } catch (error) {
    //                     console.error('Error polling bot status:', error);
    //                     return [transcript._id, null];
    //                 }
    //             })
    //         );

    //         setTranscripts(prev => prev.map(transcript => ({
    //             ...transcript,
    //             botStatus: botStatuses.find(([id]) => id === transcript._id)?.[1] || transcript.botStatus
    //         })));
    //     };

    //     const pollInterval = setInterval(pollBotStatuses, 5000000);
    //     return () => clearInterval(pollInterval);
    // }, [transcripts]);

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
                                        transcript={{
                                            ...transcript,
                                            progress: uploadProgress[transcript._id] || 0,
                                            uploadStatus: transcript.uploadStatus
                                        }}
                                        onDelete={fetchProjectDetails}
                                    />
                                ))}
                        </div>

                        <div className="questions-section">
                            <CreateQuestionOverlay 
                                projectId={projectId}
                                onSave={handleSaveQuestions}
                                questionsCreatedDateTime={project.questionsCreatedDateTime}
                                existingQuestions={project.questions}
                                transcripts={project.transcripts}
                            />
                        </div>
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

                    <UploadOptionsMenu
                        open={dialogOpen}
                        onClose={() => setDialogOpen(false)}
                        onSubmit={handleSubmit}
                    />
                </div>
            )}
        </>
    );
}

export default IndividualProjectPage;