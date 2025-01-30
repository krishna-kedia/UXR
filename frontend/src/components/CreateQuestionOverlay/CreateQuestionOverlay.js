// UXR/frontend/src/components/CreateQuestionOverlay/CreateQuestionOverlay.js
import React, { useState } from 'react';
import './CreateQuestionOverlay.css';
import Loader from '../Loader/Loader';
import QuestionBox from '../QuestionBox/QuestionBox';

function CreateQuestionOverlay({ onClose, projectId, onSave }) {
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
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

            if (!response.ok) {
                throw new Error('Failed to generate questions');
            }

            const data = await response.json();
            console.log(data)
            setQuestions(Object.values(data));
        } catch (error) {
            setError('Uh oh! Something went wrong. Please try again.');
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
        <div className="overlay">
            <div className="overlay-content">
                {loading ? (
                    <Loader />
                ) : questions.length > 0 ? (
                    <div>
                        {questions.map((question, index) => (
                            <QuestionBox 
                                key={index} 
                                question={question} 
                                onChange={(newText) => handleQuestionChange(index, newText)} 
                            />
                        ))}
                        <div className="overlay-buttons">
                            <button onClick={handleSave}>Save Questions</button>
                            <button onClick={onClose}>Go back</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p>
                            We will generate questions based on the transcripts provided by you.
                            Please note that you won't be able to generate questions again in the next 24 hours.
                        </p>
                        <div className="overlay-buttons">
                            <button onClick={onClose}>Go back</button>
                            <button onClick={handleGenerateQuestions}>Generate questions</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CreateQuestionOverlay;