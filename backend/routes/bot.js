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
                meeting_url: req.body.meetingLink,
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

        // if (!response.ok) {
        //     throw new Error('Failed to create bot');
        // }
        console.log(response, "response")

        const data = await response.json();
        const botSession = await BotSession.create({
            meeting_url: req.body.meetingLink,
            meeting_name: req.body.meetingName,
            botId: data.bot_id
        });

        const savedBotSession = await botSession.save()
        // Create new transcript
        const transcript = await Transcript.create({
            transcriptName: req.body.meetingName,
            bot_session_id: savedBotSession._id,
            origin: 'meeting_recording'
        });

        const savedTranscript = await transcript.save()
        console.log(savedTranscript)
        
        const project = await Project.findById(req.body.project_id)

        await Project.findByIdAndUpdate(
            req.body.projectId,
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
  