import React from 'react';
import './AnalysisTable.css';

function AnalysisTable({ 
    questions, 
    transcripts, 
    answers, 
    loadingColumns, 
    errorColumns,
    onAnalyzeColumn 
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
                        {transcripts.map((transcript) => (
                            <th key={transcript._id} className="column-header">
                                <div className="column-header-content">
                                    {transcript.transcriptName}
                                    {loadingColumns[transcript._id] && (
                                        <div className="column-loading">Analyzing...</div>
                                    )}
                                    {!answers[transcript._id] || 
                                     Object.keys(answers[transcript._id]).length === 0 ? (
                                        <button 
                                            className="analyze-column-btn"
                                            onClick={() => onAnalyzeColumn(transcript, questions)}
                                            disabled={loadingColumns[transcript._id]}
                                        >
                                            Analyse now
                                        </button>
                                    ) : null}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {questions.map((question, rowIndex) => (
                        <tr key={rowIndex}>
                            <th className="row-header">{question}</th>
                            {transcripts.map((transcript) => {
                                const hasData = answers[transcript._id] && 
                                              Object.keys(answers[transcript._id]).length > 0;
                                
                                return (
                                    <td key={transcript._id} className="table-cell">
                                        {hasData ? (
                                            answers[transcript._id]?.[rowIndex + 1] || ''
                                        ) : (
                                            rowIndex === 0 ? (
                                                <div className="no-data-message">
                                                    No data available for this transcript
                                                </div>
                                            ) : null
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AnalysisTable; 