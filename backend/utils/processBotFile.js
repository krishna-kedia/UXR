const Transcript = require('../models/transcriptModel');

/**
 * Process a bot recording file
 * @param {Object} params - The parameters for processing
 * @param {string} params.botUrl - URL of the bot recording
 * @param {string} params.s3FilePath - S3 path where file will be stored
 * @param {string} params.transcriptId - ID of the associated transcript
 * @returns {Promise<Object>} - Processed data
 * @throws {Error} - If processing fails
 */
async function processBotFile({ botUrl, s3FilePath, transcriptId }) {
    try {
        // Update status to PROCESSING at start
        await Transcript.findByIdAndUpdate(transcriptId, {
            uploadStatus: 'PROCESSING'
        });

        // Input validation
        if (!botUrl || !s3FilePath || !transcriptId) {
            throw new Error(JSON.stringify({
                message: 'Missing required parameters',
                details: {
                    botUrl: !botUrl,
                    s3FilePath: !s3FilePath,
                    transcriptId: !transcriptId
                }
            }));
        }

        // Make direct API call to processing service
        const processResponse = await fetch('http://localhost:8000/process-bot-file/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_url: botUrl,
                s3_file_path: s3FilePath,
                transcribe_method: 'aws',
                transcribe_lang: 'en-US',
                transcribe_speaker_number: 2
            })
        });

        // Handle API response
        if (!processResponse.ok) {
            const errorData = await processResponse.json();
            await Transcript.findByIdAndUpdate(transcriptId, {
                uploadStatus: 'PROCESSING_FAILED'
            });

            throw new Error(JSON.stringify({
                message: 'Failed to process bot recording',
                status: processResponse.status,
                statusText: processResponse.statusText,
                apiError: errorData.detail || errorData.error || 'Unknown processing error',
                transcriptId: transcriptId
            }));
        }

        // Parse and return successful response
        const processedData = await processResponse.json();
        await Transcript.findByIdAndUpdate(transcriptId, {
            text: processedData.transcript,
            questions: processedData.questions,
            uploadStatus: 'READY_TO_USE',
            s3Key: s3FilePath,
            s3Url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${s3FilePath}`
        });

        return {
            success: true,
            data: processedData
        };

    } catch (error) {
        console.error('Error in processBotFile:', error);
        throw error;
    }
}

module.exports = processBotFile; 