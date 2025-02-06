import React from 'react';
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
        <div className="analysis-table">
            <table>
                <thead>
                    <tr>
                        <th className="question-column">Questions</th>
                        {transcripts.map((transcript) => (
                            <th key={transcript._id} className="transcript-column">
                                <div className="transcript-header">
                                    <span>{transcript.transcriptName}</span>
                                    {loadingColumns[transcript._id] && (
                                        <span className="analyzing-text">Analyzing...</span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {questions.map((question, index) => (
                        <tr key={index}>
                            <td className="question-cell">{question}</td>
                            {transcripts.map((transcript) => (
                                <td key={transcript._id} className="answer-cell">
                                    {answers[transcript._id]?.[index + 1] || ''}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AnalysisTable; 