// UXR/frontend/src/components/LoadingBar/LoadingBar.js
import React from 'react';
import './Loader.css';

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

export default Loader;