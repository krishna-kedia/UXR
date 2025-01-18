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
    const { projectId } = useParams();

    const fetchAnswersForTranscript = async (transcript, questionsList) => {
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
            setAnswers(prev => ({
                ...prev,
                [transcript._id]: data
            }));
        } catch (error) {
            console.error('Error fetching answers:', error);
            setErrorColumns(prev => ({ ...prev, [transcript._id]: true }));
        } finally {
            setLoadingColumns(prev => ({ ...prev, [transcript._id]: false }));
        }
    };

    const handleRetryColumn = async (transcriptId) => {
        const transcript = transcripts.find(t => t._id === transcriptId);
        if (transcript) {
            await fetchAnswersForTranscript(transcript, questions);
        }
    };

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                // Fetch project details
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

                // Fetch questions for this project
                const questionsResponse = await fetch(`http://localhost:5001/api/questions/project/${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!questionsResponse.ok) {
                    throw new Error('Failed to fetch questions');
                }

                const questionsData = await questionsResponse.json();
                console.log('Questions Data:', questionsData);

                // Fetch transcripts
                const transcriptResponse = await fetch(`http://localhost:5001/api/transcripts/project/${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!transcriptResponse.ok) {
                    throw new Error('Failed to fetch transcripts');
                }

                const transcriptData = await transcriptResponse.json();
                console.log('Transcript Data:', transcriptData);

                // Set the states with proper data mapping
                const questionsList = questionsData.map(q => q.question) || [];
                const transcriptsList = transcriptData.map(t => ({
                    name: t.transcriptName,
                    content: t.content,
                    _id: t._id
                })) || [];

                console.log('Processed Questions:', questionsList);
                console.log('Processed Transcripts:', transcriptsList);

                setQuestions(questionsList);
                setTranscripts(transcriptsList);

                // Start fetching answers for each transcript
                transcriptsList.forEach(transcript => {
                    fetchAnswersForTranscript(transcript, questionsList);
                });
                
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
            <h1>Analysis</h1>
            <AnalysisTable 
                questions={questions} 
                transcripts={transcripts}
                answers={answers}
                loadingColumns={loadingColumns}
                errorColumns={errorColumns}
                onRetryColumn={handleRetryColumn}
            />
        </div>
    );
}

export default AnalysisPage; 