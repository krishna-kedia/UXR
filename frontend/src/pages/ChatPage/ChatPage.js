import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatDialogueBox from '../../components/ChatDialogueBox/ChatDialogueBox';
import './ChatPage.css';

function ChatPage() {
    const { projectId } = useParams();
    const [selectedTranscript, setSelectedTranscript] = useState(null);
    const [transcripts, setTranscripts] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                // Fetch project details
                const projectResponse = await fetch(`http://localhost:5001/api/projects/${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const projectData = await projectResponse.json();
                setProjectName(projectData.projectName);

                // Fetch transcripts
                const transcriptsResponse = await fetch(`http://localhost:5001/api/transcripts/project/${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const transcriptsData = await transcriptsResponse.json();
                setTranscripts(transcriptsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchProjectDetails();
    }, [projectId]);

    const handleTranscriptSelect = (event) => {
        const value = event.target.value;
        if (value === 'project') {
            setSelectedTranscript({ id: 'project', name: projectName });
        } else {
            const transcript = transcripts.find(t => t._id === value);
            setSelectedTranscript(transcript);
        }
    };

    const handleSendMessage = async (message) => {
        // Check if a transcript is selected
        if (!selectedTranscript) {
            setMessages(prev => [...prev, { 
                type: 'error', 
                content: 'Please select a transcript or project first' 
            }]);
            return;
        }

        setIsLoading(true);
        setMessages(prev => [...prev, { type: 'user', content: message }]);

        try {
            let response;
            
            if (selectedTranscript.id === 'project') {
                // Call project-wide endpoint
                response = await fetch('http://127.0.0.1:8000/get-answer/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        project_id: projectId,
                        question: message,
                        top_n: 3
                    })
                });
            } else {
                // Call single transcript endpoint
                response = await fetch('http://127.0.0.1:8000/get-single-answer/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        transcript_id: selectedTranscript._id,
                        question: message
                    })
                });
            }

            if (!response.ok) {
                throw new Error('Failed to get answer');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { 
                type: 'api', 
                content: data.answer 
            }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { 
                type: 'error', 
                content: 'Uh, AI I tell you. We ran into an error, please try again' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-page">
            <h1>Ask questions to your data</h1>
            
            <div className="transcript-selector">
                <select 
                    onChange={handleTranscriptSelect}
                    value={selectedTranscript?._id || ''}
                >
                    <option value="">Select a transcript</option>
                    <option value="project">Project: {projectName}</option>
                    {transcripts.map(transcript => (
                        <option key={transcript._id} value={transcript._id}>
                            {transcript.transcriptName}
                        </option>
                    ))}
                </select>
            </div>

            {selectedTranscript && (
                <div className="chat-context">
                    You're chatting with {selectedTranscript.name || selectedTranscript.transcriptName}
                </div>
            )}

            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div 
                        key={index} 
                        className={`message ${
                            message.type === 'user' 
                                ? 'user-message' 
                                : message.type === 'error' 
                                    ? 'error-message' 
                                    : 'api-message'
                        }`}
                    >
                        {message.content}
                    </div>
                ))}
                {isLoading && (
                    <div className="loading-message">
                        AI is thinking...
                    </div>
                )}
            </div>

            <ChatDialogueBox 
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                disabled={!selectedTranscript}
            />
        </div>
    );
}

export default ChatPage; 