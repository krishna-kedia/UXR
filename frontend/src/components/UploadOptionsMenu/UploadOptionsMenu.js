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
    Alert,
    Grid
} from '@mui/material';
import './UploadOptionsMenu.css';

function UploadOptionsMenu({ open, onClose, onSubmit, error }) {
    const { projectId } = useParams(); // Destructure projectId from useParams
    // Form states
    const [selectedOption, setSelectedOption] = useState('upload');
    const [transcriptName, setTranscriptName] = useState('');
    const [interviewerName, setInterviewerName] = useState('');
    const [intervieweeName, setIntervieweeName] = useState('');
    const [language, setLanguage] = useState('');
    const [file, setFile] = useState(null);
    const [meetingLink, setMeetingLink] = useState('');
    const [meetingName, setMeetingName] = useState('');
    const [formError, setFormError] = useState('');
    const [noOfPeople, setNoOfPeople] = useState('');
    const [metadata, setMetadata] = useState({
        no_of_people: '',
        interviewer_name: '',
        interviewee_names: '',
        language: ''
    });

    const validateLink = (link) => {
        const validDomains = ['zoom.us', 'meet.google.com'];
        try {
            const url = new URL(link);
            return validDomains.some(domain => url.hostname.includes(domain));
        } catch {
            return false;
        }
    };

    const handleOptionChange = (option) => {
        setSelectedOption(option);
        resetForm();
    };

    const resetForm = () => {
        setTranscriptName('');
        setInterviewerName('');
        setIntervieweeName('');
        setLanguage('');
        setFile(null);
        setMeetingLink('');
        setMeetingName('');
        setFormError('');
        setNoOfPeople('');
        setMetadata({
            no_of_people: '',
            interviewer_name: '',
            interviewee_names: '',
            language: ''
        });
    };

    const handleSubmit = () => {
        if (selectedOption === 'upload') {
            if (!transcriptName || !file) {
                setFormError('Please fill in all required fields');
                return;
            }
            onSubmit({
                type: 'upload',
                data: {
                    transcriptName,
                    file,
                    metadata: {
                        no_of_people: noOfPeople,
                        interviewer_name: interviewerName,
                        interviewee_names: intervieweeName,
                        language: language
                    }
                }
            });
            
            onClose();
            resetForm();
        } else {
            if (!meetingLink || !meetingName) {
                setFormError('Please fill in all required fields');
                return;
            }
            if (!validateLink(meetingLink)) {
                setFormError('Please enter a valid Zoom or Google Meet link');
                return;
            }
            onSubmit({
                type: 'bot',
                data: {
                    meetingLink,
                    meetingName
                }
            });
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            className="upload-dialog"
        >
            <div className="option-tabs">
                <button 
                    className={`option-tab ${selectedOption === 'upload' ? 'active' : ''}`}
                    onClick={() => handleOptionChange('upload')}
                >
                    Upload audio/video/text
                </button>
                <button 
                    className={`option-tab ${selectedOption === 'bot' ? 'active' : ''}`}
                    onClick={() => handleOptionChange('bot')}
                >
                    Invite bot to meeting
                </button>
            </div>

            <DialogContent>
                {selectedOption === 'upload' ? (
                    <div className="form-container">
                        <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{ mb: 3 }}
                        >
                            Choose File
                            <input
                                type="file"
                                hidden
                                onChange={(e) => setFile(e.target.files[0])}
                                accept=".pdf,.doc,.docx,.mp3,.mp4,.wav,.txt"
                            />
                        </Button>
                        {file && (
                            <div className="selected-file" style={{ marginBottom: '20px' }}>
                                Selected: {file.name}
                            </div>
                        )}

                        <TextField
                            label="Transcript Name"
                            value={transcriptName}
                            onChange={(e) => setTranscriptName(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                            sx={{ mb: 3 }}
                        />

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Number of People"
                                    type="number"
                                    value={noOfPeople}
                                    onChange={(e) => setNoOfPeople(e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Interviewer Name"
                                    value={interviewerName}
                                    onChange={(e) => setInterviewerName(e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Interviewee Name(s)"
                                    value={intervieweeName}
                                    onChange={(e) => setIntervieweeName(e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Language</InputLabel>
                                    <Select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        label="Language"
                                    >
                                        <MenuItem value="Hindi">Hindi</MenuItem>
                                        <MenuItem value="English">English</MenuItem>
                                        <MenuItem value="Hinglish">Hinglish</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </div>
                ) : (
                    <div className="form-container">
                        <TextField
                            label="Meeting Link"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                            placeholder="e.g., https://zoom.us/j/123456789"
                        />
                        <TextField
                            label="Meeting Name"
                            value={meetingName}
                            onChange={(e) => setMeetingName(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                            placeholder="e.g., User Interview with John"
                        />
                    </div>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    {selectedOption === 'upload' ? 'Upload' : 'Invite Bot'}
                </Button>
            </DialogActions>

            {(formError || error) && (
                <Snackbar open={!!(formError || error)} autoHideDuration={6000} onClose={() => setFormError('')}>
                    <Alert severity="error" onClose={() => setFormError('')}>
                        {formError || error}
                    </Alert>
                </Snackbar>
            )}
        </Dialog>
    );
}

export default UploadOptionsMenu;