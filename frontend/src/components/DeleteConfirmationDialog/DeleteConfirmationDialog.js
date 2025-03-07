import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box
} from '@mui/material';

function DeleteConfirmationDialog({ 
    open, 
    onClose, 
    onConfirm, 
    projectName, 
    transcriptsCount, 
    questionsCount 
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Delete Project?</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Are you sure you want to delete <strong>{projectName}</strong>?
                    </Typography>
                    <Typography variant="body2" color="error">
                        This will permanently delete:
                    </Typography>
                    <ul>
                        <li>{transcriptsCount} transcripts</li>
                        <li>{questionsCount} questions</li>
                        <li>All associated chat history</li>
                        <li>All files stored in AWS S3</li>
                    </ul>
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                        This action cannot be undone.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={onConfirm} 
                    color="error" 
                    variant="contained"
                >
                    Delete Project
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DeleteConfirmationDialog; 