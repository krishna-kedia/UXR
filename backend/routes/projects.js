const express = require('express');
const router = express.Router();
const Project = require('../models/projectModel');
const auth = require('../middleware/auth');

// Get project by ID
router.get('/:projectId', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add transcript to project
router.patch('/:projectId/transcripts', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { transcriptId } = req.body;

        const project = await Project.findByIdAndUpdate(
            projectId,
            { $push: { transcripts: transcriptId } },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 