// UXR/frontend/src/components/LoadingBar/LoadingBar.js
import React from 'react';
import { CircularProgress, Box } from '@mui/material';
import './Loader.css';

function Loader() {
    return (
        <Box className="loader-container">
            <CircularProgress />
        </Box>
    );
}

export default Loader;

/* Original Implementation
function Loader() {
    return (
        <div className="container">
            {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className={`baton-${i}`}>
                    <div className="metronome">
                        <div className="baton"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
*/