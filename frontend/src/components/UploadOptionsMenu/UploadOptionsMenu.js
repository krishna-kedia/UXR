import React, { useState } from 'react';
import { 
    Menu, 
    MenuItem, 
    Button,
    ListItemIcon,
    ListItemText 
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import VideoChatIcon from '@mui/icons-material/VideoChat';
import './UploadOptionsMenu.css';

function UploadOptionsMenu({ onUploadClick, onBotInvite, isUploading }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOptionSelect = (option) => {
        handleClose();
        if (option === 'bot') {
            onBotInvite();
        } else {
            onUploadClick();
        }
    };

    return (
        <div>
            <Button
                onClick={handleClick}
                disabled={isUploading}
                variant="contained"
                className="upload-btn"
            >
                {isUploading ? 'Uploading...' : 'Add new transcript'}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <MenuItem onClick={() => handleOptionSelect('transcript')}>
                    <ListItemIcon>
                        <UploadFileIcon />
                    </ListItemIcon>
                    <ListItemText>Upload transcript</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleOptionSelect('media')}>
                    <ListItemIcon>
                        <VideoFileIcon />
                    </ListItemIcon>
                    <ListItemText>Upload audio/video</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleOptionSelect('bot')}>
                    <ListItemIcon>
                        <VideoChatIcon />
                    </ListItemIcon>
                    <ListItemText>Invite bot to meeting</ListItemText>
                </MenuItem>
            </Menu>
        </div>
    );
}

export default UploadOptionsMenu; 