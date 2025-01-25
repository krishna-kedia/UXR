const express = require('express');
const router = express.Router();
const Project = require('../models/projectModel');
const Question = require('../models/questionModel');
const auth = require('../middleware/auth');
const User = require('../models/userModel');

// FetchAllProjects: Get all projects for authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const projects = await Project.find({ createdBy: req.user._id })
            .sort({ createdAt: -1 }); // Sort by newest first

        res.json(projects);
    } catch (error) {
        console.error('Error in FetchAllProjects:', error);
        res.status(500).json({ error: error.message });
    }
});

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

// Create new project
router.post('/', auth, async (req, res) => {
    try {
        const { projectName, userId } = req.body;
        console.log(userId);
        // Create initial empty questions
        const initialQuestions = Array(10).fill().map(() => new Question({ question: '' }));
        const savedQuestions = await Question.insertMany(initialQuestions);

        // Create new project
        const project = new Project({
            projectName,
            questions: savedQuestions.map(q => q._id),
            createdBy: userId,
            questionsCreatedDateTime: null
        });

        const savedProject = await project.save();

        // Update user's projects array
        await User.findByIdAndUpdate(
            userId,
            { $push: { projects: savedProject._id } },
            { new: true }
        );

        res.status(201).json(savedProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 