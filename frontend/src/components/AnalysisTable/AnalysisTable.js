import React from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper 
} from '@mui/material';
import './AnalysisTable.css';

const AnalysisTable = ({ questions, transcripts, answers, loadingColumns, errorColumns, onAnalyzeColumn }) => {
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
                                {question}
                            </TableCell>
                            {transcripts.map((transcript) => (
                                <TableCell key={transcript._id} className="answer-cell">
                                    {answers[transcript._id]?.[index + 1] || ''}
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