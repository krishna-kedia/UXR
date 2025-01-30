const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const textract = require('textract');
const Transcript = require('../models/transcriptModel');
const Project = require('../models/projectModel');
const auth = require('../middleware/auth');
const {uploadToS3} = require('../utils/s3Operations')
const TranscriptText = require('../models/transcriptTextModel')

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  // fileFilter: (req, file, cb) => {
  //   const allowedTypes = {
  //     'application/pdf': true,
  //     'application/msword': true,
  //     'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  //     'audio/mpeg': true,
  //     'audio/mp4': true,
  //     'audio/wav': true,
  //     'text/plain': true
  //   };
    
  //   if (allowedTypes[file.mimetype]) {
  //     cb(null, true);
  //   } else {
  //     cb(new Error('Invalid file type. Only PDF, DOC, DOCX, MP3, MP4, WAV, and TXT files are allowed.'));
  //   }
  // },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});



// Upload transcript endpoint
// Update upload endpoint
router.post('/upload', auth, upload.single('transcript'), async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
      }

      const { projectId, userId } = req.body;
      if (!projectId) {
          return res.status(400).json({ error: 'Project ID is required' });
      }

      // Check if project exists and belongs to user
      const project = await Project.findById(projectId);

      if (!project) {
          return res.status(404).json({ error: 'Project not found' });
      }

      // Upload to S3
      const { s3Key, s3Url } = await uploadToS3(req.file, req.user._id, projectId);

      // Create transcript document
      const transcript = new Transcript({
          transcriptName: req.body.transcriptName || req.file.originalname,
          projectId: projectId,
          userId: req.user._id,
          transcriptDate: new Date(),
          fileType: req.file.mimetype,
          fileName: req.file.originalname,
          s3Url: s3Url,
          s3Key: s3Key,
          origin: "user_uploaded"
      });

      const savedTranscript = await transcript.save();

      // Add transcript to project's transcripts array
      await Project.findByIdAndUpdate(
          projectId,
          { $push: { transcripts: transcript._id } }
      );

      const processFileResponse = await fetch('http://localhost:8000/process-file/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: transcript.s3Url, // Replace with actual S3 URL
            transcribe_method: 'aws', // or 'aws' based on your requirement
            transcribe_lang: 'en-US' // or any other language code
        })
    });

    if (!processFileResponse.ok) {
        throw new Error('Failed to process file');
    }

    const processFileData = await processFileResponse.json();

    console.log('Processed File Data:', processFileData);

    const transcriptText = new TranscriptText({
      text: processFileData.transcript
  });

  const savedTranscriptText = await transcriptText.save();

  // Update the Transcript document to reference the new TranscriptText
  savedTranscript.text = savedTranscriptText._id;
  await savedTranscript.save();

      res.status(201).json({
          message: 'Transcript uploaded successfully',
          transcript: {
              id: transcript._id,
              transcriptName: transcript.transcriptName,
              transcriptDate: transcript.transcriptDate,
              fileType: transcript.fileType,
              fileName: transcript.fileName,
              hasText: !!transcript.text,
              createdAt: transcript.createdAt,
              text: savedTranscript.text
          }
      });



  } catch (error) {
      console.error('Upload error:', error);
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

        // First get the project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // If project has no transcripts, return empty array
        if (!project.transcripts || project.transcripts.length === 0) {
            return res.json([]);
        }

        // Then fetch all transcripts that belong to this project
        const transcripts = await Transcript.find({
            '_id': { $in: project.transcripts }
        });
        res.json(transcripts);
    } catch (error) {
        console.error('Error fetching project transcripts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update QA endpoint
router.patch('/updateQA', auth, async (req, res) => {
    const { transcriptId, qaObject } = req.body;

    if (!transcriptId || !qaObject || typeof qaObject !== 'object') {
        return res.status(400).json({ error: 'Invalid request data' });
    }

    try {
        const transcript = await Transcript.findById(transcriptId);
        if (!transcript) {
            return res.status(404).json({ error: 'Transcript not found' });
        }

        // Push current ActiveQuestionsAnswers to PastQuestionsArray
        const pastEntry = {
            dateOfChange: Date.now(),
            qaObject: transcript.ActiveQuestionsAnswers
        };
        transcript.PastQuestionsArray.push(pastEntry);

        // Replace ActiveQuestionsAnswers with new qaObject
        transcript.ActiveQuestionsAnswers = qaObject;

        // Save the updated transcript
        const updatedTranscript = await transcript.save();

        res.json(updatedTranscript);
    } catch (error) {
        console.error('Error updating QA:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;