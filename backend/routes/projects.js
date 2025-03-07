const express = require('express');
const router = express.Router();
const Project = require('../models/projectModel');
const Question = require('../models/questionModel');
const Transcript = require('../models/transcriptModel');
const ChatSession = require('../models/chatSessionModel');
const auth = require('../middleware/auth');
const User = require('../models/userModel');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// FetchAllProjects: Get all projects for authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'projects',
                options: { sort: { createdAt: -1 } } // Sort by newest first
            });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.projects);
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
                path: 'questions',
                match: { question: { $ne: '' } } 
            });

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

// Delete project
router.delete('/:projectId', auth, async (req, res) => {
    try {
        const { projectId } = req.params;

        // Get project with all related data
        const project = await Project.findById(projectId)
            .populate('transcripts')
            .populate('questions');

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // 1. Delete S3 files
        const s3DeletePromises = project.transcripts
            .filter(transcript => transcript.s3Url)
            .map(transcript => {
                try {
                    const key = transcript.s3Url.split('.com/')[1];
                    if (!key) {
                        console.error('Invalid S3 URL format:', transcript.s3Url);
                        return Promise.resolve(); // Skip if URL is invalid
                    }
                    return s3.deleteObject({
                        Bucket: process.env.AWS_S3_BUCKET_NAME,
                        Key: key
                    }).promise().catch(err => {
                        console.error('Error deleting S3 object:', err);
                        return Promise.resolve(); // Continue with deletion even if S3 fails
                    });
                } catch (error) {
                    console.error('Error processing S3 URL:', error);
                    return Promise.resolve(); // Skip if there's an error
                }
            });

        await Promise.all(s3DeletePromises);

        // 2. Delete all related data
        await Promise.all([
            // Delete all transcripts
            ...project.transcripts.map(transcript => 
                Transcript.findByIdAndDelete(transcript._id)
            ),
            // Delete all questions
            ...project.questions.map(question => 
                Question.findByIdAndDelete(question._id)
            ),
            // Delete all chat sessions related to this project
            ChatSession.deleteMany({ projectId }),
            // Remove project from user's projects array
            User.findByIdAndUpdate(
                req.user._id,
                { $pull: { projects: projectId } }
            ),
            // Delete the project itself
            Project.findByIdAndDelete(projectId)
        ]);

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update project
router.put('/:projectId', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { projectName } = req.body;

        const project = await Project.findByIdAndUpdate(
            projectId,
            { projectName },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 