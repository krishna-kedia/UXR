const express = require('express');
const router = express.Router();
const Project = require('../models/projectModel');
const Transcript = require('../models/transcriptModel');
const ChatSession = require('../models/chatSessionModel');
const User = require('../models/userModel');
const auth = require('../middleware/auth');

// Get all projects and transcripts for chat
router.get('/data', auth, async (req, res) => {
    try {
        // 1. Fetch projects using IDs from user.projects array
        const projects = await Project.find({ 
            _id: { $in: req.user.projects }
        }).select('projectName _id transcripts');
        
        // 2. Fetch transcripts details for all projects
        const transcriptIds = projects.flatMap(project => project.transcripts);
        const transcripts = await Transcript.find({ 
            _id: { $in: transcriptIds }
        }).select('transcriptName _id projectId');
        // 3. Format data for frontend
        const formattedData = projects.map(project => ({
            id: project._id,
            name: project.projectName,
            transcripts: project.transcripts
                .map(transcriptId => {
                    const transcript = transcripts.find(t => 
                        t._id.toString() === transcriptId.toString()
                    );
                    return transcript ? {
                        id: transcript._id,
                        name: transcript.transcriptName
                    } : null;
                })
                .filter(Boolean) // Remove any null values
        }));

        res.json({ projects: formattedData });
    } catch (error) {
        console.error('Error fetching chat data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new chat session
router.post('/start', auth, async (req, res) => {
    try {
        const { type, projectId, transcriptId, projectName, transcriptName } = req.body;
        // Validate project exists

        // Check if user has reached session limit
        // const user = await User.findById(req.user.id);
        // if (user.chatSessions.length >= 10) {
        //     return res.status(400).json({ 
        //         message: 'Maximum chat session limit reached. Please delete some existing sessions.' 
        //     });
        // }

        // Create new chat session
        const chatSession = new ChatSession({
            chatName: type === 'project' ? projectName : transcriptName,
            project_id: projectId,
            transcript_id: type === 'transcript' ? transcriptId : null,
            chat_type: type,
            history: [],
            delete_time: null,
            num_interactions: 0
        });

        await chatSession.save();

        // Add session to user's chatSessions
        await User.findByIdAndUpdate(
            req.user.id,
            { $push: { chatSessions: chatSession._id } }
        );

        res.status(201).json({
            id: chatSession._id,
            chatName: chatSession.chatName,
            type: chatSession.chat_type
        });

    } catch (error) {
        console.error('Error creating chat session:', error);
        res.status(500).json({ message: 'Failed to create chat session' });
    }
});

// Get all chat sessions for a user
router.get('/sessions', auth, async (req, res) => {
    try {
        // Get user with populated chatSessions
        const user = await User.findById(req.user.id)
            .populate({
                path: 'chatSessions',
                select: 'chatName project_id transcript_id chat_type createdAt conversation',
                options: { sort: { 'createdAt': -1 } } // Sort by creation date descending  
            });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Format the sessions data
        const formattedSessions = user.chatSessions.map(session => ({
            sessionId: session._id,
            chatName: session.chatName,
            projectId: session.project_id,
            transcriptId: session.transcript_id,
            type: session.chat_type,
            conversation: session.conversation
        }));

        res.json({ sessions: formattedSessions });

    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        res.status(500).json({ message: 'Failed to fetch chat sessions' });
    }
});

module.exports = router; 