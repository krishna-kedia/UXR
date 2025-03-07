import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    Button,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './NewProjectDialogueBox.css';

function NewProjectDialogueBox({ onClose, onAdd, initialValue = '', isEdit = false }) {
    const [projectName, setProjectName] = useState(initialValue);
    const [error, setError] = useState('');

    useEffect(() => {
        setProjectName(initialValue);
    }, [initialValue]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (projectName.trim()) {
            onAdd(projectName.trim());
        }
    };

    return (
        <Dialog 
            open={true} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            className="new-project-dialog"
        >
            <DialogTitle className="dialog-title">
                {isEdit ? 'Edit Project' : 'Create New Project'}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    className="close-button"
                    size="small"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Project Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={projectName}
                        onChange={(e) => {
                            setProjectName(e.target.value);
                            setError('');
                        }}
                        error={!!error}
                        helperText={error}
                        size="small"
                        required
                    />
                </DialogContent>

                <DialogActions className="dialog-actions">
                    <Button 
                        onClick={onClose} 
                        color="inherit"
                        className="cancel-button"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        disabled={!projectName.trim()}
                    >
                        {isEdit ? 'Save Changes' : 'Create Project'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default NewProjectDialogueBox; 