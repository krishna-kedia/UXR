import React, { useState } from 'react';
import './ChatDialogueBox.css';

function ChatDialogueBox({ onSendMessage, isLoading, disabled }) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <form className="chat-dialogue-box" onSubmit={handleSubmit}>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={disabled ? "Select a transcript to start chatting" : "type your text here"}
                disabled={isLoading || disabled}
                className="chat-input"
            />
            <button 
                type="submit" 
                className="chat-send-button"
                disabled={isLoading || disabled || !message.trim()}
            >
                {'>'}
            </button>
        </form>
    );
}

export default ChatDialogueBox; 