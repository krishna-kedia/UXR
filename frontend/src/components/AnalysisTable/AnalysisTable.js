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

    console.log('Answers:', answers); // Debug log

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
                                    {!answers[transcript._id] ? (
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
                                const transcriptAnswers = answers[transcript._id];
                                // Get answer from the numbered response format
                                const answer = transcriptAnswers?.answer?.[rowIndex + 1] || 
                                             transcriptAnswers?.[rowIndex + 1] ||
                                             '';
                                
                                return (
                                    <td key={transcript._id} className="table-cell">
                                        {loadingColumns[transcript._id] ? (
                                            <div className="loading-cell">Loading...</div>
                                        ) : transcriptAnswers ? (
                                            <div className="answer-cell">
                                                {answer}
                                            </div>
                                        ) : (
                                            <div className="no-data-message">
                                                Click Analyze to get insights
                                            </div>
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