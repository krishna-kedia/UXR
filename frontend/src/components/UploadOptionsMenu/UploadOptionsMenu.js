import React, { useState } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    TextField,
    Select,
    FormControl,
    InputLabel,
    Snackbar,
    Alert
} from '@mui/material';
import InviteBotDialog from '../InviteBotDialog/InviteBotDialog';
import './UploadOptionsMenu.css';

function UploadOptionsMenu({ onUploadClick, onBotInvite, isUploading }) {
    const { projectId } = useParams(); // Destructure projectId from useParams
    const [dialogOpen, setDialogOpen] = useState(false);
    const [option, setOption] = useState('');
    const [transcriptName, setTranscriptName] = useState('');
    const [interviewerName, setInterviewerName] = useState('');
    const [intervieweeName, setIntervieweeName] = useState('');
    const [language, setLanguage] = useState('');
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setOption('');
        setTranscriptName('');
        setInterviewerName('');
        setIntervieweeName('');
        setLanguage('');
        setFile(null);
        setError('');
    };

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!transcriptName || !file) {
            setError('Transcript Name and File are required.');
            return;
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('transcript', file);
        formData.append('transcriptName', transcriptName);
        formData.append('interviewerName', interviewerName);
        formData.append('intervieweeName', intervieweeName);
        formData.append('language', language);
        formData.append('projectId', projectId)
        formData.append('userId', localStorage.getItem('userId'));

        sessionStorage.setItem('uploadData', JSON.stringify({
            transcriptName,
            fileName: file.name,
            language: language,
            processing: true
        }));

        setDialogOpen(false); // Close the overlay

        try {
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

            const data = await response.json();
            //setSuccess('Upload successful!');
            sessionStorage.removeItem('uploadData'); // Remove session storage
            //onUploadComplete(data); // Notify parent component of successful upload
            window.location.reload(); // Reload the page
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div>
            <Button
                onClick={handleOpenDialog}
                disabled={isUploading}
                variant="contained"
                className="upload-btn"
            >
                {isUploading ? 'Uploading...' : 'Add new transcript'}
            </Button>
            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Select an Option</DialogTitle>
                <DialogContent>
                    {!option && (
                        <div>
                            <MenuItem onClick={() => setOption('upload')}>Upload files</MenuItem>
                            <MenuItem onClick={() => setOption('bot')}>Invite bot to meeting</MenuItem>
                        </div>
                    )}
                    {option === 'upload' && (
                        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                            <TextField
                                label="Transcript Name"
                                value={transcriptName}
                                onChange={(e) => setTranscriptName(e.target.value)}
                                required
                                fullWidth
                                helperText="It's suggested that you name this file properly, it'll help you with analysis later."
                            />
                            <TextField
                                label="Name of Interviewer"
                                value={interviewerName}
                                onChange={(e) => setInterviewerName(e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="Name of Interviewee"
                                value={intervieweeName}
                                onChange={(e) => setIntervieweeName(e.target.value)}
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel>Language</InputLabel>
                                <Select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    required
                                >
                                    <MenuItem value="Hindi">Hindi</MenuItem>
                                    <MenuItem value="English">English</MenuItem>
                                    <MenuItem value="Hinglish">Hinglish</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.mp3,.mp4,.wav,.txt"
                                required
                            />
                            <Button type="submit" variant="contained" color="primary" style={{ marginTop: '10px' }}>
                                Upload
                            </Button>
                        </form>
                    )}
                    {option === 'bot' && (
                        <InviteBotDialog open={true} onClose={handleCloseDialog} projectId={projectId} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
            {error && (
                <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={() => setError('')}>
                    <Alert onClose={() => setError('')} severity="error">
                        {error}
                    </Alert>
                </Snackbar>
            )}
        </div>
    );
}

export default UploadOptionsMenu;