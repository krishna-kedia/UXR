import React, { useState } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField,
    Typography 
} from '@mui/material';
import Loader from '../Loader/Loader';
import './InviteBotDialog.css';

function InviteBotDialog({ open, onClose, projectId }) {
    const [meetingLink, setMeetingLink] = useState('');
    const [meetingName, setMeetingName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validateLink = (link) => {
        const validDomains = ['zoom.us', 'meet.google.com'];
        try {
            const url = new URL(link);
            return validDomains.some(domain => url.hostname.includes(domain));
        } catch {
            return false;
        }
    };

    const handleLinkChange = (e) => {
        const link = e.target.value;
        setMeetingLink(link);
        if (link && !validateLink(link)) {
            setError('Please enter a valid Zoom or Google Meet link');
        } else {
            setError('');
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5001/api/bot/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    meeting_url: meetingLink,
                    meeting_name: meetingName,
                    project_id: projectId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create bot');
            }

            // Show success message
            const successMessage = `Bot will accompany you to ${meetingName}`;
            alert(successMessage); // Replace with a better notification system
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            setError('Failed to create bot. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isValid = meetingLink && meetingName && validateLink(meetingLink);

    return (
        <Dialog 
            open={open} 
            maxWidth="sm" 
            fullWidth 
            className="bot-dialog"
        >
            <DialogTitle>
                Invite bot to Google Meet, Zoom
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <TextField
                            fullWidth
                            label="Meeting link (invitation Link)"
                            value={meetingLink}
                            onChange={handleLinkChange}
                            error={!!error}
                            helperText={error}
                            margin="normal"
                            placeholder="e.g. https://us06web.zoom.us/j/9873966000"
                        />
                        <TextField
                            fullWidth
                            label="Meeting name"
                            value={meetingName}
                            onChange={(e) => setMeetingName(e.target.value)}
                            margin="normal"
                            placeholder="e.g. Meeting with InSpin Co. onboarding interview"
                        />
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    color="primary" 
                    variant="contained"
                    disabled={!isValid || loading}
                >
                    Invite bot
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default InviteBotDialog; 