import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AnalysisTable from '../../components/AnalysisTable/AnalysisTable';
import './AnalysisPage.css';

function AnalysisPage() {
    const [questions, setQuestions] = useState([]);
    const [transcripts, setTranscripts] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loadingColumns, setLoadingColumns] = useState({});
    const [errorColumns, setErrorColumns] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { projectId } = useParams();

    const analyzeTranscript = async (transcript, questionsList) => {
        setLoadingColumns(prev => ({ ...prev, [transcript._id]: true }));
        setErrorColumns(prev => ({ ...prev, [transcript._id]: false }));

        try {
            // Format questions as required by the API
            const questionObject = questionsList.reduce((acc, q, index) => {
                acc[index + 1] = q;
                return acc;
            }, {});

            const response = await fetch('http://127.0.0.1:8000/get-all-answer-single-transcript-grid/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: questionObject,
                    transcript_id: transcript._id
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch answers');
            }

            const data = await response.json();

            // Update transcript's ActiveQuestionsAnswers
            await fetch('http://localhost:5001/api/transcripts/updateQA', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    transcriptId: transcript._id,
                    qaObject: data
                })
            });

            setAnswers(prev => ({
                ...prev,
                [transcript._id]: data
            }));
        } catch (error) {
            console.error('Error analyzing transcript:', error);
            setErrorColumns(prev => ({ ...prev, [transcript._id]: true }));
        } finally {
            setLoadingColumns(prev => ({ ...prev, [transcript._id]: false }));
        }
    };

    const handleAnalyzeAll = async () => {
        setIsAnalyzing(true);
        try {
            await Promise.all(transcripts.map(transcript => 
                analyzeTranscript(transcript, questions)
            ));
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                // 1. Fetch project details first
                const projectResponse = await fetch(`http://localhost:5001/api/projects/${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!projectResponse.ok) {
                    throw new Error('Failed to fetch project details');
                }

                const projectData = await projectResponse.json();
                console.log('Project Data:', projectData);

                // 2. Fetch questions for this project
                const questionsResponse = await fetch(`http://localhost:5001/api/questions/project/${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!questionsResponse.ok) {
                    throw new Error('Failed to fetch questions');
                }

                // 3. Fetch transcripts for this project
                const transcriptsResponse = await fetch(`http://localhost:5001/api/transcripts/project/${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!transcriptsResponse.ok) {
                    throw new Error('Failed to fetch transcripts');
                }

                const questionsData = await questionsResponse.json();
                const transcriptsData = await transcriptsResponse.json();

                console.log('Questions Data:', questionsData);
                console.log('Transcripts Data:', transcriptsData);

                // Process the data
                const questionsList = questionsData.map(q => q.question) || [];
                const transcriptsList = transcriptsData || [];

                setQuestions(questionsList);
                setTranscripts(transcriptsList);

                // Set initial answers from ActiveQuestionsAnswers
                const initialAnswers = transcriptsList.reduce((acc, transcript) => {
                    acc[transcript._id] = transcript.ActiveQuestionsAnswers || {};
                    return acc;
                }, {});
                setAnswers(initialAnswers);

            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProjectDetails();
        }
    }, [projectId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="analysis-page">
            <div className="analysis-header">
                <h1>Analysis</h1>
                <button 
                    className="analyze-all-btn"
                    onClick={handleAnalyzeAll}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? 'Analyzing...' : 'Analyse data again'}
                </button>
            </div>
            <AnalysisTable 
                questions={questions} 
                transcripts={transcripts}
                answers={answers}
                loadingColumns={loadingColumns}
                errorColumns={errorColumns}
                onAnalyzeColumn={analyzeTranscript}
            />
        </div>
    );
}

export default AnalysisPage; 