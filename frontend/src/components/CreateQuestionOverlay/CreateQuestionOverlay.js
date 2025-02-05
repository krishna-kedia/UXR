// UXR/frontend/src/components/CreateQuestionOverlay/CreateQuestionOverlay.js
import React, { useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogActions, 
    Button, 
    Typography,
    Box
} from '@mui/material';
import './CreateQuestionOverlay.css';
import Loader from '../Loader/Loader';
import QuestionBox from '../QuestionBox/QuestionBox';

const CreateQuestionOverlay = ({ projectId, onSave, questionsCreatedDateTime, existingQuestions }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    console.log(existingQuestions, questionsCreatedDateTime);

    const handleGenerateQuestions = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://127.0.0.1:8000/generate-questions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ project_id: projectId })
            });

            if (!response.ok) {
                throw new Error('Failed to generate questions');
            }

            const data = await response.json();
            setQuestions(Object.values(data));
        } catch (error) {
            setError('Failed to generate questions');
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionChange = (index, newText) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = newText;
        setQuestions(updatedQuestions);
    };

    return (
        <div className="questions-overlay">
            {loading ? (
                <div className="loader-container">
                    <Loader />
                </div>
            ) : error ? (
                <div className="error-container">
                    <Typography color="error">{error}</Typography>
                </div>
            ) : questionsCreatedDateTime ? (
                <div className="questions-list">
                    <Typography variant="h6">Questions for this project</Typography>
                    {existingQuestions.map((question, index) => (
                        <QuestionBox
                            key={index}
                            question={question.question}
                            onChange={(newText) => handleQuestionChange(index, newText)}
                        />
                    ))}
                    <Button 
                        onClick={() => onSave(questions)}
                        variant="contained"
                        className="save-button"
                    >
                        Save Changes
                    </Button>
                </div>
            ) : (
                <div className="generate-questions">
                    <Typography className="intro-text">
                        AI will generate common questions from all transcripts in this project.
                    </Typography>
                    <Box className="info-box">
                        <Typography variant="h3">Things to keep in mind:</Typography>
                        <ul>
                            <li>
                                <span className="icon">✔️</span>
                                Review and edit questions if they seem inconsistent with the transcripts.
                            </li>
                            <li>
                                <span className="icon">⚠️</span>
                                AI-generated content isn't always perfect.
                            </li>
                            <li>
                                <span className="icon">🔄</span>
                                You can't generate questions again until you upload a new transcript.
                            </li>
                        </ul>
                    </Box>
                    <Button 
                        onClick={handleGenerateQuestions}
                        variant="contained"
                        className="generate-button"
                    >
                        Generate Questions
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CreateQuestionOverlay;