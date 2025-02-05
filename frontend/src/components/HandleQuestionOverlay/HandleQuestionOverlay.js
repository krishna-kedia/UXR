import React, { useState, useEffect } from 'react';
import './HandleQuestionOverlay.css';
import CloseIcon from '@mui/icons-material/Close';
import QuestionItem from './QuestionItem';
import CircularProgress from '@mui/material/CircularProgress';
import { useParams } from 'react-router-dom';
const HandleQuestionOverlay = ({ existingQuestions, onSave, onClose }) => {
    const [currentQuestions, setCurrentQuestions] = useState(existingQuestions || []);
    const [newQuestions, setNewQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const {projectId} = useParams();

    useEffect(() => {
        generateQuestions();
    }, []);

    const generateQuestions = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://127.0.0.1:8000/generate-questions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ project_id: projectId })
            });

            if (!response.ok) {
                throw new Error('Failed to generate questions');
            }

            const data = await response.json();
            console.log(data);
            setNewQuestions(Object.values(data) || []);
        } catch (error) {
            console.error('Error generating questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (index, isNew = false) => {
        if (isNew) {
            setNewQuestions(prev => prev.filter((_, i) => i !== index));
        } else {
            setCurrentQuestions(prev => prev.filter((_, i) => i !== index));
        }
        console.log(currentQuestions, "handle delete")
        
    };

    const handleEdit = (index, newText, isNew = false) => {
        if (isNew) {
            setNewQuestions(prev => prev.map((q, i) => i === index ? newText : q));
        } else {
            setCurrentQuestions(prev => prev.map((q, i) => i === index ? newText : q));
        }
        console.log(currentQuestions, "handle edit")
    };

    const handleMove = (index) => {
        const questionToMove = newQuestions[index];
        setNewQuestions(prev => prev.filter((_, i) => i !== index));
        setCurrentQuestions(prev => [...prev, questionToMove]);
        console.log(currentQuestions, "handle move")
    };

    const handleAddNew = () => {
        setCurrentQuestions(prev => [...prev, '']); 
        console.log(currentQuestions, "handle add new")
    };

    const handleBackdropClick = (e) => {
        if (e.target.className === 'overlay-backdrop') {
            onClose();
        }
    };

    return (
        <div 
            className="overlay-backdrop"
            onClick={handleBackdropClick}
        >
            <div className="overlay-container">
                <div className="overlay-header">
                    <h2>Review and Finalize Questions</h2>
                    <button 
                        className="close-button"
                        onClick={onClose}
                    >
                        <CloseIcon />
                    </button>
                </div>
                
                <div className="overlay-content-question-div">
                    <div className="questions-panel left-panel">
                        <h3>Current Questions</h3>
                        <div className="questions-list">
                            {currentQuestions.map((question, index) => (
                                <QuestionItem
                                    key={index}
                                    question={question}
                                    onDelete={() => handleDelete(index)}
                                    onEdit={(newText) => handleEdit(index, newText)}
                                />
                            ))}
                            <div 
                                className="add-question-box"
                                onClick={handleAddNew}
                            >
                                + Add new question
                            </div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="questions-panel right-panel">
                        <h3>New Questions</h3>
                        <div className="questions-list">
                            {loading ? (
                                <div className="loading-container">
                                    <CircularProgress size={24} />
                                    <p>Generating questions...</p>
                                </div>
                            ) : (
                                newQuestions.map((question, index) => (
                                    <QuestionItem
                                        key={index}
                                        question={question}
                                        onDelete={() => handleDelete(index, true)}
                                        onEdit={(newText) => handleEdit(index, newText, true)}
                                        onMove={() => handleMove(index)}
                                        isNewQuestion={true}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="overlay-footer">
                    <button 
                        className="save-button-question-overlay"
                        onClick={() => onSave(currentQuestions)}
                    >
                        Save Questions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HandleQuestionOverlay; 