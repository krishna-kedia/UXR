const express = require('express');
const router = express.Router();
const Question = require('../models/questionModel');
const Project = require('../models/projectModel');
const BotSession = require('../models/botSessionModel');
const Transcript = require('../models/transcriptModel')
const auth = require('../middleware/auth');
const crypto = require('crypto');

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
            origin: 'meeting_recording'
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
        console.error('Error creating bot:', error);
        res.status(500).json({ error: 'Failed to create bot' });
    }
});

// Webhook handler route
router.post('/webhook/:webhookId', async (req, res) => {
    try {
        const { webhookId } = req.params;
        const eventData = req.body;
        
        console.log('\n🎯 Webhook endpoint hit');
        console.log('📍 Webhook ID:', webhookId);
        console.log('📦 Event Data:', JSON.stringify(eventData, null, 2));
        
        const botSession = await BotSession.findOne({ 
            webhook_url: { $regex: webhookId } 
        });

        if (!botSession) {
            console.error('❌ Bot session not found for webhookId:', webhookId);
            return res.status(404).json({ error: 'Bot session not found' });
        }

        console.log('✅ Found bot session:', botSession._id);

        switch (eventData.event) {
            case 'bot.status_change':
                console.log('🔄 Processing status change event');
                console.log('📊 New Status:', eventData.data.status.code);
                
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
                console.log('✅ Status update completed');
                break;

            case 'complete':
                console.log('🎉 Processing complete event');
                console.log('📹 Recording URL:', eventData.data.mp4);
                console.log('👥 Number of speakers:', eventData.data.speakers.length);
                
                await BotSession.findByIdAndUpdate(
                    botSession._id,
                    {
                        status: {
                            code: 'call_ended',
                            created_at: new Date()
                        },
                        recording_url: eventData.data.mp4,
                        speakers: eventData.data.speakers,
                        transcript: eventData.data.transcript,
                        $push: {
                            eventLogs: {
                                type: 'complete',
                                message: 'Meeting recording completed successfully',
                                timestamp: new Date()
                            }
                        }
                    }
                );
                console.log('✅ Complete event processed');
                break;

            case 'failed':
                console.log('❌ Processing failed event');
                console.log('💥 Error:', eventData.data.error);
                
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
                console.log('✅ Failed event processed');
                break;

            default:
                console.log('⚠️ Unknown event type:', eventData.event);
        }

        console.log('✨ Webhook processing completed successfully\n');
        res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('💥 Webhook error:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: error.message });
    }
});

// Get bot session status
router.get('/status/:botSessionId', auth, async (req, res) => {
    try {
        console.log('Fetching bot status for:', req.params.botSessionId); // Debug log
        
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
  