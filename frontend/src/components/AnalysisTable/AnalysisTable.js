import React from 'react';
import './AnalysisTable.css';

function AnalysisTable({ 
    questions, 
    transcripts, 
    answers, 
    loadingColumns, 
    errorColumns, 
    onRetryColumn 
}) {
    if (!questions?.length || !transcripts?.length) {
        return (
            <div className="analysis-empty-state">
                You need to have at least 1 transcript and 1 question for analysis to work
            </div>
        );
    }

    return (
        <div className="analysis-table-container">
            <table className="analysis-table">
                <thead>
                    <tr>
                        <th className="corner-header"></th>
                        {transcripts.map((transcript, index) => (
                            <th key={index} className="column-header">
                                {transcript.name}
                                {loadingColumns[transcript._id] && (
                                    <div className="column-loading">Loading...</div>
                                )}
                                {errorColumns[transcript._id] && (
                                    <button 
                                        className="retry-button"
                                        onClick={() => onRetryColumn(transcript._id)}
                                    >
                                        Retry
                                    </button>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {questions.map((question, rowIndex) => (
                        <tr key={rowIndex}>
                            <th className="row-header">{question}</th>
                            {transcripts.map((transcript) => (
                                <td key={transcript._id} className="table-cell">
                                    {answers[transcript._id]?.[rowIndex + 1] || ''}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AnalysisTable; 