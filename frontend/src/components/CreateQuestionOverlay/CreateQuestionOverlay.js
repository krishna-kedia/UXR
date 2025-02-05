// UXR/frontend/src/components/CreateQuestionOverlay/CreateQuestionOverlay.js
import React, { useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogActions, 
    Button, 
    Typography,
    Box,
    Divider
} from '@mui/material';
import './CreateQuestionOverlay.css';
import Loader from '../Loader/Loader';
import QuestionBox from '../QuestionBox/QuestionBox';
import { useNavigate } from 'react-router-dom';

const CreateQuestionOverlay = ({ projectId, onSave, questionsCreatedDateTime, existingQuestions, hasTranscripts }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [questions, setQuestions] = useState(
        existingQuestions?.map(q => q.question) || []
    );
    console.log(questions);

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
            console.log(data);
            setQuestions(Object.values(data));
            await onSave(Object.values(data));
        } catch (error) {
            setError('Failed to generate questions');
            console.log(error);
        } finally {
            setLoading(false);
        }


    };

    const handleQuestionChange = (index, newText) => {
        setQuestions(prevQuestions => {
            const updatedQuestions = [...prevQuestions];
            updatedQuestions[index] = newText;
            return updatedQuestions;
        });
        
    };

    const handleAnalysisClick = () => {
        navigate(`/analysis/${projectId}`);
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
                <>
                    <div className="questions-header">
                        <div className="header-row">
                            <Typography variant="h6" className="title">
                                Questions for the project
                            </Typography>
                            <Button 
                                variant="outlined" 
                                className="analysis-btn"
                                onClick={handleAnalysisClick}
                            >
                                See analysis
                            </Button>
                        </div>
                        <Typography className="created-date">
                            Questions created on: {new Date(questionsCreatedDateTime).toLocaleDateString()}
                        </Typography>
                    </div>

                    <div className="questions-content">
                        {existingQuestions?.map((questionObj, index) => (
                            <QuestionBox
                                key={questionObj._id || index}
                                question={questionObj.question}
                                onChange={(newText) => handleQuestionChange(index, newText)}
                            />
                        ))}
                    </div>

                    <div className="questions-footer">
                        <Button 
                            variant="contained"
                            className="save-button"
                            onClick={() => onSave(questions)}
                            fullWidth
                        >
                            Save changes
                        </Button>
                        <Button 
                            variant="outlined"
                            className="generate-button"
                            onClick={handleGenerateQuestions}
                            fullWidth
                        >
                            Create questions
                        </Button>
                    </div>
                </>
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
                            variant="outlined"
                            className="generate-again-button"
                            onClick={handleGenerateQuestions}
                            fullWidth
                        >
                            Create questions again
                        </Button>
                    {!hasTranscripts && (
                        <Typography className="helper-text">
                            Add transcripts to generate questions
                        </Typography>
                    )}
                </div>
            )}
        </div>
    );
};

export default CreateQuestionOverlay;