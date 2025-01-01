const express = require('express');
const router = express.Router();
const multer = require('multer');
const Transcript = require('../models/transcriptModel');
const auth = require('../middleware/auth');
const Project = require('../models/projectModel');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedTypes = ['application/pdf', 'application/msword', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, and TXT files are allowed.'));
        }
    }
});

// Upload transcript
router.post('/upload', auth, upload.single('transcript'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const transcript = new Transcript({
            transcriptName: req.body.transcriptName || req.file.originalname,
            transcriptDate: new Date(),
            content: req.file.buffer // Adding content field to store the file
        });

        await transcript.save();

        res.status(201).json({
            message: 'Transcript uploaded successfully',
            transcript: {
                id: transcript._id,
                transcriptName: transcript.transcriptName,
                transcriptDate: transcript.transcriptDate,
                createdAt: transcript.createdAt
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all transcripts
router.get('/', auth, async (req, res) => {
    try {
        const transcripts = await Transcript.find()
            .select('transcriptName transcriptDate lastProcessingDate createdAt')
            .sort('-createdAt');

        res.json(transcripts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single transcript
router.get('/:id', auth, async (req, res) => {
    try {
        const transcript = await Transcript.findById(req.params.id);
        if (!transcript) {
            return res.status(404).json({ error: 'Transcript not found' });
        }

        res.json(transcript);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete transcript
router.delete('/:id', auth, async (req, res) => {
    try {
        const transcript = await Transcript.findByIdAndDelete(req.params.id);
        if (!transcript) {
            return res.status(404).json({ error: 'Transcript not found' });
        }

        res.json({ message: 'Transcript deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update transcript's lastProcessingDate
router.patch('/:id/process', auth, async (req, res) => {
    try {
        const transcript = await Transcript.findByIdAndUpdate(
            req.params.id,
            { lastProcessingDate: new Date() },
            { new: true }
        );

        if (!transcript) {
            return res.status(404).json({ error: 'Transcript not found' });
        }

        res.json(transcript);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transcripts by project ID
router.get('/project/:projectId', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        console.log('Fetching transcripts for project:', projectId); // Debug log

        // First get the project
        const project = await Project.findById(projectId);
        if (!project) {
            console.log('Project not found'); // Debug log
            return res.status(404).json({ error: 'Project not found' });
        }

        console.log('Found project:', project); // Debug log
        console.log('Project transcripts:', project.transcripts); // Debug log

        // If project has no transcripts, return empty array
        if (!project.transcripts || project.transcripts.length === 0) {
            return res.json([]);
        }

        // Then fetch all transcripts that belong to this project
        const transcripts = await Transcript.find({
            '_id': { $in: project.transcripts }
        }).select('transcriptName transcriptDate createdAt');

        console.log('Found transcripts:', transcripts); // Debug log
        res.json(transcripts);
    } catch (error) {
        console.error('Error fetching project transcripts:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 