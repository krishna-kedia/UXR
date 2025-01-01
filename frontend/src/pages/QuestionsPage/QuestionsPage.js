import React, { useState } from 'react';
import QuestionBox from '../../components/QuestionBox/QuestionBox';
import './QuestionsPage.css';

function QuestionsPage() {
    const [questions, setQuestions] = useState([
        "This is the first question",
        "If someone wants to change any question",
        "They can do so by just hovering. Cursor will change into a text icon",
        "And the button at the bottom will become active, prompting them to save the changes"
    ]);

    const [hasChanges, setHasChanges] = useState(false);

    const handleQuestionChange = (newText, index) => {
        const newQuestions = [...questions];
        newQuestions[index] = newText;
        setQuestions(newQuestions);
        setHasChanges(true);
    };

    const handleSave = () => {
        // Handle saving changes here
        setHasChanges(false);
    };

    return (
        <div className="questions-container">
            <h1>Questions</h1>
            
            <div className="questions-list">
                {questions.map((question, index) => (
                    <QuestionBox
                        key={index}
                        question={question}
                        onChange={(newText) => handleQuestionChange(newText, index)}
                    />
                ))}
            </div>

            {hasChanges && (
                <div className="save-button-container">
                    <button className="save-button" onClick={handleSave}>
                        Save changes
                    </button>
                </div>
            )}
        </div>
    );
}

export default QuestionsPage;