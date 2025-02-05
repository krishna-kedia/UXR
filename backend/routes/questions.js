// backend/routes/questions.js
const express = require('express');
const router = express.Router();
const Question = require('../models/questionModel');
const Project = require('../models/projectModel');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Create multiple questions and update project
router.post('/', auth, async (req, res) => {
  try {
    const { questions, projectId } = req.body;
    console.log(questions, projectId);

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    const project = await Project.findById(projectId).populate('questions');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    let createdQuestions = [];
    if(questions.length != project.questions.length &&  questions.length > project.questions.length){
      const extraQuestionsCount = questions.length - project.questions.length;
      const initialQuestions = Array(extraQuestionsCount).fill().map(() => new Question({ question: '' }));
      createdQuestions = await Question.insertMany(initialQuestions);
    }

    // Collect past questions
    const pastQuestions = project.questions
      .map(q => q.question)
      .filter(q => q);

    // Update pastQuestions in the project
    project.pastQuestions.push(...pastQuestions);
    await project.save();
    
    project.questions.push(...createdQuestions.map(q => q._id));  
    // Update existing question documents with new questions
    const updatePromises = project.questions.map((q, index) => {
      return Question.findByIdAndUpdate(q._id, { question: questions[index] || '' });
    });

    await Promise.all(updatePromises);

    project.questionsCreatedDateTime = Date.now();
    project.noOfTranscriptsWhenQuestionsCreated = project.transcripts.length;
    await project.save();

    res.status(200).json({ message: 'Questions updated successfully' });
  } catch (error) {
    console.error('Error updating questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get questions for a specific project
router.get('/project/:projectId', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const project = await Project.findById(projectId).populate('questions');
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project.questions);
    } catch (error) {
        console.error('Error fetching project questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;