const express = require('express');
const router = express.Router();
const Question = require('../models/questionModel');
const Project = require('../models/projectModel');
const BotSession = require('../models/botSessionModel');
const Transcript = require('../models/transcriptModel')
const User = require('../models/userModel');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const {processBotFile,
    uploadToS3,
    processTranscript,
    generateTranscriptQuestions} = require('../utils/processBotFile');

// Helper function to generate webhook URL
const generateWebhookUrl = () => {
    const webhookId = crypto.randomBytes(7).toString('hex');
    const baseUrl = process.env.BASE_URL
    return {
        url: `${baseUrl}/api/bot/webhook/${webhookId}`,
        id: webhookId
    };
};

// Create a new bot
router.post('/create', auth, async (req, res) => {
    try {
        const { url: webhookUrl } = generateWebhookUrl();

        // Create bot session
        const botSession = await BotSession.create({
            meeting_url: req.body.meetingLink,
            meeting_name: req.body.meetingName,
            webhook_url: webhookUrl,
            eventLogs: [{
                type: 'status_change',
                message: 'Bot session created',
                timestamp: new Date()
            }]
        });

        // Create bot on MeetingBaas
        const response = await fetch("https://api.meetingbaas.com/bots", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-meeting-baas-api-key": process.env.MEETING_BAAS_API_KEY,
            },
            body: JSON.stringify({
                meeting_url: req.body.meetingLink,
                webhook_url: webhookUrl,
                bot_name: "AI Notetaker",
                reserved: false,
                recording_mode: "speaker_view",
                bot_image: "https://example.com/bot.jpg",
                entry_message: "I am a good meeting bot :)",
                speech_to_text: {
                    provider: "Default",
                },
                automatic_leave: {
                    waiting_room_timeout: 600,
                },
            }),
        });

        const data = await response.json();
        
        // Update botSession with botId
        await BotSession.findByIdAndUpdate(botSession._id, {
            botId: data.bot_id
        });

        // Create transcript
        const transcript = await Transcript.create({
            transcriptName: req.body.meetingName,
            bot_session_id: botSession._id,
            origin: 'meeting_recording',
            uploadStatus: 'SCHEDULED_TO_JOIN'
        });

        // Update project with transcript
        await Project.findByIdAndUpdate(
            req.body.projectId,
            { $push: { transcripts: transcript._id } },
            { new: true }
        );

        res.status(201).json({ 
            bot_id: data.bot_id,
            session_id: botSession._id,
            transcript_id: transcript._id,
        });

    } catch (error) {
        console.error('Error in /create:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create bot',
                details: error.message
            }
        });
    }
});

// Webhook handler route
router.post('/webhook/:webhookId', async (req, res) => {
    try {
        const { webhookId } = req.params;
        const eventData = req.body;
        
        const botSession = await BotSession.findOne({ 
            webhook_url: { $regex: webhookId } 
        });

        if (!botSession) {
            console.error('❌ Bot session not found for webhookId:', webhookId);
            return res.status(404).json({ error: 'Bot session not found' });
        }

        switch (eventData.event) {
            case 'bot.status_change':
                let transcript = await Transcript.findOne({ bot_session_id: botSession._id });
                if (!transcript) {
                    console.error('Error in bot processing: Associated transcript not found');
                    break;
                }
                transcript.uploadStatus = 'MEETING_STARTED';
                await transcript.save();
                
                await BotSession.findByIdAndUpdate(
                    botSession._id,
                    {
                        status: {
                            code: eventData.data.status.code,
                            created_at: eventData.data.status.created_at
                        },
                        $push: {
                            eventLogs: {
                                type: 'status_change',
                                status: {
                                    code: eventData.data.status.code,
                                    created_at: eventData.data.status.created_at
                                },
                                message: `Status changed to: ${eventData.data.status.code}`,
                                timestamp: new Date()
                            }
                        }
                    }
                );
                break;

            case 'complete':
                console.error('Processing complete event');
                const transcript1 = await Transcript.findOne({ bot_session_id: botSession._id });
                transcript1.uploadStatus = 'MEETING_COMPLETED';
                await transcript1.save();

                // Find project containing this transcript
                const project = await Project.findOne({ 
                    transcripts: { $in: [transcript1._id] }
                });
                if (!project) {
                    console.error('Error in bot processing: Project not found for transcript');
                    break;
                }

                const user = await User.findOne({
                    projects: { $in: [project._id] }
                })
                if (!user) {
                    console.error('Error in bot processing: User not found for project');
                    break;
                }

                try {
                    // const timestamp1 = new Date();
                    const sessionId = botSession._id;
                    const sanitizedFileName = transcript1.transcriptName.replace(/\s+/g, '-');
                    const s3FilePath = `upload-data/users/${user._id}/${project._id}/transcripts/${sanitizedFileName}.mp4`;
                    
                    // Step 1: Upload to S3
                    try {
                        await uploadToS3({
                            botUrl: eventData.data.mp4,
                            s3FilePath,
                            sessionId: sessionId
                        });
                        await Transcript.findByIdAndUpdate(transcript1._id, {
                            uploadStatus: 'UPLOAD_COMPLETED',
                            s3Key: s3FilePath,
                            s3Url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${s3FilePath}`
                        });
                    } catch (error) {
                        await Transcript.findByIdAndUpdate(transcript1._id, {
                            uploadStatus: 'UPLOAD_FAILED'
                        });
                        throw error;
                    }

                    // Step 2: Process Transcript
                    const transcript = await processTranscript({
                        fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${s3FilePath}`,
                        transcriptId: transcript1._id,
                        transcribeMethod: 'aws',
                        transcribeLang: 'en-US',
                        transcribeSpeakerNumber: 2
                    });
                    await Transcript.findByIdAndUpdate(transcript1._id, {
                        text: transcript,
                        uploadStatus: 'PROCESSED'
                    });

                    // Step 3: Generate Questions
                    const questions = await generateTranscriptQuestions(transcript1._id);
                    await Transcript.findByIdAndUpdate(transcript1._id, {
                        questions,
                        uploadStatus: 'READY_TO_USE'
                    });

                } catch (error) {
                    console.error('Error processing bot recording:', error);
                    // Only update status if it's not already UPLOAD_FAILED
                    const currentTranscript = await Transcript.findById(transcript1._id);
                    if (currentTranscript.uploadStatus !== 'UPLOAD_FAILED') {
                        await Transcript.findByIdAndUpdate(transcript1._id, {
                            uploadStatus: 'PROCESSING_FAILED'
                        });
                    }
                }
                break;

            case 'failed':
                console.log('💥 Error:', eventData.data.error);
                    transcript1.uploadStatus = 'BOT_FAILED';
                await transcript1.save();
                
                await BotSession.findByIdAndUpdate(
                    botSession._id,
                    {
                        status: {
                            code: 'error',
                            created_at: new Date()
                        },
                        $push: {
                            eventLogs: {
                                type: 'error',
                                message: `Meeting failed: ${eventData.data.error}`,
                                timestamp: new Date()
                            }
                        }
                    }
                );

                break;

            default:
                console.log('⚠️ Unknown event type:', eventData.event);
        }

        res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('💥 Webhook error:', error);
        res.status(500).json({ error: error.message });
        
        // Find the transcript before updating it
        const transcript = await Transcript.findOne({ bot_session_id: botSession._id });
        if (transcript) {
            transcript.uploadStatus = 'BOT_FAILED';
            await transcript.save();
        }
    }
});

// Get bot session status
router.get('/status/:botSessionId', auth, async (req, res) => {
    try {
        
        const botSession = await BotSession.findById(req.params.botSessionId)
            .select('status eventLogs recording_url')
            .lean();
        
        if (!botSession) {
            console.log('Bot session not found'); // Debug log
            return res.status(404).json({ error: 'Bot session not found' });
        }
        res.json(botSession);
    } catch (error) {
        console.error('Error fetching bot status:', error);
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
  