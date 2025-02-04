import React, { useState } from 'react';
import './QuestionBox.css';

const QuestionBox = ({ question, onChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(question);

    const handleBlur = () => {
        setIsEditing(false);
        if (text !== question) {
            onChange(text);
        }
    };

    return (
        <div 
            className="question-box"
            onClick={() => setIsEditing(true)}
        >
            {isEditing ? (
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={handleBlur}
                    autoFocus
                    className="question-input"
                />
            ) : (
                <p className="question-text">
                    {text || <span className="placeholder">Click to edit...</span>}
                </p>
            )}
        </div>
    );
};

export default QuestionBox;
