import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AnalysisTable from '../../components/AnalysisTable/AnalysisTable';
import './AnalysisPage.css';
import Loader from '../../components/Loader/Loader';
import { Button } from '@mui/material';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper 
} from '@mui/material';

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
            const transcriptId = transcript._id;    

            const response = await fetch(`/fastapi/get-all-answer-single-transcript-grid/${transcriptId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: questionObject,
                    transcript_id: transcriptId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch answers');
            }

            const data = await response.json();

            // Update transcript's ActiveQuestionsAnswers
            await fetch('/api/transcripts/updateQA', {
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
                const response = await fetch(`/api/projects/${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch project details');
                }

                const projectData = await response.json();

                // Get questions array from project data
                const questionsList = projectData.questions?.map(q => q.question) || [];
                
                // Get transcripts array from project data
                const transcriptsList = projectData.transcripts || [];

                // Set initial answers from ActiveQuestionsAnswers in transcripts
                const initialAnswers = transcriptsList.reduce((acc, transcript) => {
                    // Each transcript has ActiveQuestionsAnswers object with numbered keys
                    acc[transcript._id] = transcript.ActiveQuestionsAnswers || {};
                    return acc;
                }, {});

                setQuestions(questionsList);
                setTranscripts(transcriptsList);
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

    if (loading) return (
        <div className="loader-container">
            <Loader />
        </div>
    );
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="analysis-page">
            <div className="analysis-header">
                <h1>Analysis</h1>
                <Button 
                    variant="contained"
                    color="primary"
                    onClick={handleAnalyzeAll}
                    disabled={isAnalyzing}
                    sx={{
                        textTransform: 'none',
                        minWidth: '120px',
                        fontWeight: 500
                    }}
                >
                    {isAnalyzing ? 'Analyzing...' : 'Analyse data'}
                </Button>
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