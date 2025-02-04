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

const CreateQuestionOverlay = ({ onClose, projectId, onSave }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

            console.log(response, "response")

            if (!response.ok) {
                throw new Error('Failed to generate questions');
            }

            const data = await response.json();
            console.log(data)
            setQuestions(Object.values(data));
        } catch (error) {
            // setError('Uh oh! Something went wrong. Please try again.');
            console.log(error)
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionChange = (index, newText) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = newText;
        setQuestions(updatedQuestions);
    };

    const handleSave = () => {
        if (questions.length > 0) {
            onSave(questions);
            onClose();
        }
    };

    return (
        <Dialog 
            open={true} 
            onClose={onClose}
            maxWidth={false}
            PaperProps={{ className: 'overlay-content' }}
        >
            {loading ? (
                <DialogContent className="loader-container">
                    <Loader />
                </DialogContent>
            ) : error ? (
                <DialogContent>
                    <Typography color="error" className="error-text">
                        {error}
                    </Typography>
                </DialogContent>
            ) : questions.length > 0 ? (
                <DialogContent>
                    {questions.map((question, index) => (
                        <QuestionBox
                            key={index}
                            question={question}
                            onChange={(newText) => handleQuestionChange(index, newText)}
                        />
                    ))}
                    <DialogActions className="overlay-buttons">
                        <Button onClick={onClose} className="cancel-button">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} variant="contained" className="save-button">
                            Save
                        </Button>
                    </DialogActions>
                </DialogContent>
            ) : (
                <>
                    <DialogContent className="modal-content">
                        <Typography className="intro-text">
                            AI will generate common questions from all transcripts in this project.
                        </Typography>
                        <Box className="info-box">
                            <Typography variant="h3">Things to keep in mind:</Typography>
                            <ul>
                                <li>
                                    <span className="icon">✔️</span>
                                    Review and edit questions if they seem inconsistent with the transcripts. Inconsistencies affect the analysis quality.
                                </li>
                                <li>
                                    <span className="icon">⚠️</span>
                                    AI-generated content isn’t always perfect. You can refine the questions in the next step.
                                </li>
                                <li>
                                    <span className="icon">🔄</span>
                                    You can’t generate questions again until you upload a new transcript, but you can edit them anytime.
                                </li>
                            </ul>
                        </Box>
                    </DialogContent>
                    <DialogActions className="overlay-buttons">
                        <Button onClick={onClose} className="cancel-button">
                            Go back
                        </Button>
                        <Button onClick={handleGenerateQuestions} variant="contained" className="generate-button">
                            Generate questions
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

export default CreateQuestionOverlay;