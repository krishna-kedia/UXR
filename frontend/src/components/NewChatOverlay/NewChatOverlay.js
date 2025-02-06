import React, { useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogActions, 
    Button, 
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    Tabs,
    Tab
} from '@mui/material';
import './NewChatOverlay.css';
import CircularProgress from '@mui/material/CircularProgress';

function NewChatOverlay({ open, onClose, onStartChat, projectsData, loading }) {
    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedTranscript, setSelectedTranscript] = useState('');

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
        resetSelections();
    };

    const resetSelections = () => {
        setSelectedProject('');
        setSelectedTranscript('');
    };

    const handleProjectChange = (event) => {
        setSelectedProject(event.target.value);
        setSelectedTranscript(''); // Reset transcript when project changes
    };

    const handleSubmit = () => {
        const type = selectedTab === 0 ? 'project' : 'transcript';
        const selectedProjectData = projectsData?.projects?.find(p => p.id === selectedProject);
        const selectedTranscriptData = selectedProjectData?.transcripts?.find(t => t.id === selectedTranscript);
        
        const formData = selectedTab === 0 
            ? {
                type,
                projectId: selectedProject,
                projectName: selectedProjectData?.name
            }
            : {
                type,
                projectId: selectedProject,
                transcriptId: selectedTranscript,
                transcriptName: selectedTranscriptData?.name
            };

        onStartChat(formData);
    };

    const availableTranscripts = selectedProject 
        ? projectsData?.projects?.find(p => p.id === selectedProject)?.transcripts || []
        : [];

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <Tabs 
                value={selectedTab} 
                onChange={handleTabChange}
                variant="fullWidth"
                className="chat-tabs"
            >
                <Tab label="Project" />
                <Tab label="Transcript" />
            </Tabs>

            <DialogContent>
                <div className="form-container">
                    <FormControl fullWidth margin="normal" size="small">
                        <InputLabel>Select Project</InputLabel>
                        <Select
                            value={selectedProject}
                            onChange={handleProjectChange}
                            label="Select Project"
                        >
                            {projectsData?.projects?.map(project => (
                                <MenuItem key={project.id} value={project.id}>
                                    {project.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedTab === 1 && (
                        <FormControl 
                            fullWidth 
                            margin="normal" 
                            size="small"
                            disabled={!selectedProject}
                        >
                            <InputLabel>Select Transcript</InputLabel>
                            <Select
                                value={selectedTranscript}
                                onChange={(e) => setSelectedTranscript(e.target.value)}
                                label="Select Transcript"
                            >
                                {availableTranscripts.map(transcript => (
                                    <MenuItem key={transcript.id} value={transcript.id}>
                                        {transcript.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </div>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="inherit" disabled={loading}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !selectedProject || (selectedTab === 1 && !selectedTranscript)}
                >
                    {loading ? (
                        <CircularProgress size={24} color="inherit" />
                    ) : (
                        'Start Chat'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default NewChatOverlay; 