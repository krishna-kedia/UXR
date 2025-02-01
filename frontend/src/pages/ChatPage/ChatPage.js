import React, { useState, useEffect } from 'react';
import ChatSidebar from '../../components/ChatSidebar/ChatSidebar';
import ChatDialogueBox from '../../components/ChatDialogueBox/ChatDialogueBox';
import NewChatOverlay from '../../components/NewChatOverlay/NewChatOverlay';
import Loader from '../../components/Loader/Loader';
import './ChatPage.css';

function ChatPage() {
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showNewChatOverlay, setShowNewChatOverlay] = useState(false);
    const [projectsData, setProjectsData] = useState(null);
    const [currentResponse, setCurrentResponse] = useState('');

    useEffect(() => {
        const initializeData = async () => {
            try {
                setInitialLoading(true);
                await Promise.all([
                    fetchProjectsData(),
                    fetchChatSessions()
                ]);
            } catch (error) {
                setError('Failed to load initial data');
                console.error('Initialization error:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        initializeData();
    }, []);

    const fetchProjectsData = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/chat/data', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch projects data');
            const data = await response.json();
            setProjectsData(data);
        } catch (error) {
            setError('Failed to load projects data');
            console.error('Error:', error);
        }
    };

    const fetchChatSessions = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/chat/sessions', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch chat sessions');
            }

            const data = await response.json();
            setSessions(data.sessions);
        } catch (error) {
            setError('Failed to load chat sessions');
            console.error('Error fetching sessions:', error);
        }
    };

    const handleStartNewChat = async (formData) => {
        console.log(formData);
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/chat/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to start chat');
            }
            
            const newSession = await response.json();
            setSessions(prevSessions => [...prevSessions, newSession]);
            setActiveSession(newSession);
            setShowNewChatOverlay(false);
        } catch (error) {
            setError(error.message);
            console.error('Error starting chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (message) => {
        if (!activeSession?.sessionId || loading) return;

        try {
            setLoading(true);
            setError(null);
            
            // Add user message immediately
            setMessages(prev => [...prev, { role: 'user', content: message }]);

            const response = await fetch('http://localhost:8000/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    session_id: activeSession.sessionId,
                    question: message,
                    top_n: 3 // You might want to make this configurable
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedResponse = '';

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                accumulatedResponse += chunk;

                // Update the last message with accumulated response
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: 'assistant',
                        content: accumulatedResponse
                    };
                    return newMessages;
                });
            }

            setCurrentResponse(''); // Clear current response after completion

        } catch (error) {
            console.error('Chat error:', error);
            setError('Failed to send message. Please try again.');
            // Remove the last assistant message if it failed
            setMessages(prev => prev.filter(msg => msg.content !== ''));
        } finally {
            setLoading(false);
        }
    };

    const handleSessionSelect = (session) => {
        setActiveSession(session);
        setMessages([]); // Clear messages when switching sessions
        setError(null);
    };

    return (
        <>
            {initialLoading ? (
                <Loader />
            ) : (
                <div className="chat-page">
                    <ChatSidebar 
                        sessions={sessions}
                        activeSession={activeSession}
                        onNewChat={() => setShowNewChatOverlay(true)}
                        onSessionSelect={handleSessionSelect}
                    />
                    <div className="chat-content">
                        <ChatDialogueBox 
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            loading={loading}
                            session={activeSession}
                        />
                    </div>
                    <NewChatOverlay
                        open={showNewChatOverlay}
                        onClose={() => setShowNewChatOverlay(false)}
                        onStartChat={handleStartNewChat}
                        projectsData={projectsData}
                        loading={loading}
                    />
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default ChatPage;
