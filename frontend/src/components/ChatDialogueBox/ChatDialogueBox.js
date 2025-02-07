import React, { useState, useRef, useEffect } from 'react';
import { TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import './ChatDialogueBox.css';

function ChatDialogueBox({ messages, onSendMessage, loading, session }) {
    const [userInput, setUserInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!userInput.trim() || loading) return;

        onSendMessage(userInput);
        setUserInput(''); // Clear input after sending
    };

    if (!session) {
        return (
            <div className="chat-dialogue-box empty-state">
                <div className="empty-state-content">
                    <h2>No chat selected</h2>
                    <p>Create a new chat or select an existing one to start chatting</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-dialogue-box">
            <div className="chat-header">
                <h3>{session.name}</h3>
                <span className="chat-type">
                    {session.type === 'project' ? 'Project Chat' : 'Transcript Chat'}
                </span>
            </div>

            <div className="messages-container">
                {messages.map((message, index) => (
                    <div 
                        key={index} 
                        className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                    >
                        <div className="message-content">
                            {message.message}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="input-container">
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type your message here"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={loading || !session}
                    size="small"
                />
                <IconButton 
                    type="submit" 
                    color="primary" 
                    disabled={loading || !userInput.trim() || !session}
                >
                    <SendIcon />
                </IconButton>
            </form>
        </div>
    );
}

export default ChatDialogueBox;
