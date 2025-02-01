import React from 'react';
import './ChatSidebar.css';

function ChatSidebar({ sessions, activeSession, onNewChat, onSessionSelect }) {
    return (
        <div className="chat-sidebar">
            <div className="sidebar-header">
                <h2>New chat</h2>
                <button className="new-chat-button" onClick={onNewChat}>
                    + New Chat
                </button>
            </div>

            <div className="sessions-list">
                {sessions.map(session => (
                    <div 
                        key={session.sessionId}
                        className={`session-item ${activeSession?.sessionId === session.sessionId ? 'active' : ''}`}
                        onClick={() => onSessionSelect({
                            sessionId: session.sessionId,
                            chatName: session.chatName,
                            type: session.type,
                            projectId: session.projectId,
                            transcriptId: session.transcriptId
                        })}
                    >
                        <div className="session-name">{session.chatName}</div>
                        <div className="session-type">{session.type}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ChatSidebar;
