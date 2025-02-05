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
        const project = await Project.findById(req.params.projectId)
            .select('-pastQuestions')
            .populate({
                path: 'transcripts',
                select: ' -pastQuestionsArray -text'
            })
            .populate({
                path: 'questions'
            });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        console.log(project);
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
    let createdQuestions = [];
    let createdProject = null;
    let userUpdated = false;

    try {
        const { projectName, userId } = req.body;

        // Create initial empty questions
        const initialQuestions = Array(10).fill().map(() => new Question({ question: '' }));
        createdQuestions = await Question.insertMany(initialQuestions);

        // Create new project
        const project = new Project({
            projectName,
            questions: createdQuestions.map(q => q._id),
            createdBy: userId,
            questionsCreatedDateTime: null
        });

        createdProject = await project.save();

        // Update user's projects array
        await User.findByIdAndUpdate(
            userId,
            { $push: { projects: createdProject._id } },
            { new: true }
        );
        userUpdated = true;

        res.status(201).json(createdProject);

    } catch (error) {
        console.error('Error creating project:', error);

        // Cleanup in reverse order
        try {
            // 1. Remove project reference from user if it was added
            if (userUpdated && userId && createdProject) {
                await User.findByIdAndUpdate(
                    userId,
                    { $pull: { projects: createdProject._id } }
                );
            }

            // 2. Delete the created project if it exists
            if (createdProject) {
                await Project.findByIdAndDelete(createdProject._id);
            }

            // 3. Delete all created questions
            if (createdQuestions.length > 0) {
                await Question.deleteMany({
                    _id: { $in: createdQuestions.map(q => q._id) }
                });
            }
        } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
        }

        // Send error response
        res.status(500).json({ 
            error: 'Failed to create project. All changes have been rolled back.' 
        });
    }
});

module.exports = router; 