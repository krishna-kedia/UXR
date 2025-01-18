const express = require('express');
const router = express.Router();
const Project = require('../models/projectModel');
const Question = require('../models/questionModel');
const auth = require('../middleware/auth');

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
        const { projectName, createdBy } = req.body;

        if (!projectName || !createdBy) {
            return res.status(400).json({ error: 'Project name and creator are required' });
        }

        // Create 10 blank questions
        const blankQuestions = Array.from({ length: 10 }, () => ({ question: '' }));
        const newQuestions = await Question.insertMany(blankQuestions);
        const questionIds = newQuestions.map(q => q._id);

        // Create the project with the blank question IDs
        const newProject = new Project({
            projectName,
            createdBy,
            questions: questionIds
        });

        await newProject.save();

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 