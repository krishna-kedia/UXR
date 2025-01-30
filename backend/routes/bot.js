const express = require('express');
const router = express.Router();
const Question = require('../models/questionModel');
const Project = require('../models/projectModel');
const BotSession = require('../models/botSessionModel');
const Transcript = require('../models/transcriptModel')
const auth = require('../middleware/auth');

// Create a new bot
router.post('/create', auth, async (req, res) => {
    console.log(req.body, req.user)
    try {
        const response = await fetch("https://api.meetingbaas.com/bots", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-meeting-baas-api-key": process.env.MEETING_BAAS_API_KEY,
            },
            body: JSON.stringify({
                meeting_url: req.body.meeting_url,
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

        if (!response.ok) {
            throw new Error('Failed to create bot');
        }

        const data = await response.json();
        const botSession = await BotSession.create({
            bot_id: data.bot_id,
            meeting_url: req.body.meeting_url,
            meeting_name: req.body.meeting_name,
            user_id: req.user._id,
            status: 'created'
        });

        const savedBotSession = await botSession.save()
        console.log("saved bot session", savedBotSession)
        // Create new transcript
        const transcript = await Transcript.create({
            transcriptName: req.body.meeting_name,
            bot_session_id: savedBotSession._id,
            origin: 'meeting_recording'
        });

        const savedTranscript = await transcript.save()
        console.log("saved transcript session", savedTranscript)

        
        const project = await Project.findById(req.body.project_id)
        console.log(project)
        await Project.findByIdAndUpdate(
            req.body.project_id,
            { $push: { transcripts: savedTranscript._id } },
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

router.post('/env.MEETING_BASS_WEBHOOK_URL', async (req, res) => {
    console.log(req.body);
    res.status(200).json({ message: 'Webhook received' });
});

module.exports = router;
  