import React from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper,
    Tooltip 
} from '@mui/material';
import './AnalysisTable.css';
import ChatIcon from '@mui/icons-material/Chat';

const AnalysisTable = ({ questions, transcripts, answers, loadingColumns, errorColumns, onAnalyzeColumn, projectId }) => {
    if (!questions?.length || !transcripts?.length) {
        return (
            <div className="analysis-empty-state">
                You need to have at least 1 transcript and 1 question for analysis to work
            </div>
        );
    }

    return (
        <TableContainer component={Paper} className="analysis-table-container">
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell className="header-cell questions-header">
                            Questions
                        </TableCell>
                        {transcripts.map((transcript) => (
                            <TableCell key={transcript._id} className="header-cell">
                                <div className="transcript-header">
                                    <span>{transcript.transcriptName}</span>
                                    {loadingColumns[transcript._id] && (
                                        <span className="analyzing-text">Analyzing...</span>
                                    )}
                                </div>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {questions.map((question, index) => (
                        <TableRow key={index} className="table-row">
                            <TableCell component="th" scope="row" className="question-cell">
                                <div className="cell-content">
                                    {question}
                                    <div className="chat-icon-wrapper">
                                        <Tooltip title="Chat about this question across all transcripts">
                                            <ChatIcon 
                                                className="chat-icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`/chat?project=${projectId}&question=${encodeURIComponent(question)}`, '_blank');
                                                }}
                                            />
                                        </Tooltip>
                                    </div>
                                </div>
                            </TableCell>
                            {transcripts.map((transcript) => (
                                <TableCell key={transcript._id} className="answer-cell">
                                    <div className="cell-content">
                                        {answers[transcript._id]?.[index + 1] && (
                                            <>
                                                {answers[transcript._id]?.[index + 1]}
                                                <div className="chat-icon-wrapper">
                                                    <Tooltip title="Chat about this specific answer">
                                                        <ChatIcon 
                                                            className="chat-icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(
                                                                    `/chat?project=${projectId}&transcript=${transcript._id}&question=${encodeURIComponent(question)}`,
                                                                    '_blank'
                                                                );
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default AnalysisTable; 