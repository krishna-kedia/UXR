import React, { useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import './QuestionItem.css';

const QuestionItem = ({ 
    question, 
    onDelete, 
    onEdit, 
    onMove, 
    isNewQuestion = false 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(question);

    const handleBlur = () => {
        setIsEditing(false);
        if (text !== question) {
            onEdit(text);
        }
    };

    return (
        <div className="question-item">
            <div 
                className="question-content"
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
            
            <div className="question-actions">
                <button 
                    className="action-button delete"
                    onClick={onDelete}
                    title="Delete question"
                >
                    <DeleteIcon fontSize="small" />
                </button>
                
                {isNewQuestion && (
                    <button 
                        className="action-button move"
                        onClick={onMove}
                        title="Move to final questions"
                    >
                        <ArrowForwardIcon fontSize="small" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuestionItem; 