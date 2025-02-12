const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const Transcript = require('../models/transcriptModel');
const Project = require('../models/projectModel');
const auth = require('../middleware/auth');
const {uploadToS3} = require('../utils/s3Operations')
const s3Client = require('../utils/s3Config');
const { ObjectId } = mongoose.Types;
const {processTranscript, generateTranscriptQuestions} = require('../utils/processBotFile');

const { 
    CreateMultipartUploadCommand, 
    CompleteMultipartUploadCommand, 
    AbortMultipartUploadCommand,
    DeleteObjectCommand,
    PutObjectCommand,
    UploadPartCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Initiate multipart upload
router.post('/initiate-upload', auth, async (req, res) => {
    try {
        const { fileName, fileType, fileSize, projectId, transcriptName, metadata } = req.body;

        // Validate file size
        if (!fileSize || isNaN(fileSize)) {
            return res.status(400).json({ 
                error: 'Invalid file size provided' 
            });
        }

        // Validate project
        const project = await Project.findOne({ 
            _id: projectId, 
            createdBy: req.user._id 
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Generate S3 key
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/\s+/g, '-');
        const s3Key = `upload-data/users/${req.user._id}/${projectId}/transcripts/${timestamp}-${sanitizedFileName}`;
        
        // Generate S3 URL
        const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

        // Create multipart upload in S3
        const createCommand = new CreateMultipartUploadCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            ContentType: fileType
        });

        const { UploadId } = await s3Client.send(createCommand);

        // Calculate number of parts (5MB chunks)
        const PART_SIZE = 5 * 1024 * 1024;
        const numberOfParts = Math.ceil(fileSize / PART_SIZE);

        // Create transcript record with fileSize
        const transcript = new Transcript({
            transcriptName: transcriptName || fileName,
            projectId,
            userId: req.user._id,
            transcriptDate: new Date(),
            fileType,
            fileName,
            s3Key,
            s3Url,
            uploadStatus: 'INITIATING',
            uploadId: UploadId,
            origin: "user_uploaded",
            metadata,
            fileSize: fileSize
        });

        await transcript.save();
        await Project.findByIdAndUpdate(projectId, { 
            $push: { transcripts: transcript._id } 
        });

        res.json({
            uploadId: UploadId,
            transcriptId: transcript._id,
            s3Key,
            numberOfParts
        });

    } catch (error) {
        console.error('Error initiating upload:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get signed URL for part upload
router.get('/upload-part-url', auth, async (req, res) => {
    try {
        const { partNumber, uploadId, s3Key } = req.query;
        
        // If it's the first part, update status to UPLOADING
        if (partNumber === '1') {
            await Transcript.findOneAndUpdate(
                { uploadId },
                { uploadStatus: 'UPLOADING' }
            );
        }

        const command = new UploadPartCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            UploadId: uploadId,
            PartNumber: parseInt(partNumber)
        });

        // Add CORS headers to the presigned URL request
        const signedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 3600,
            signableHeaders: new Set(['host']), // Only sign the host header
        });

        res.json({ 
            signedUrl,
            // Include these headers in the response so frontend knows what's allowed
            allowedHeaders: [
                'content-type',
                'content-length',
                'content-disposition'
            ]
        });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        res.status(500).json({ error: error.message });
    }
});

// Complete multipart upload
router.post('/complete-upload', auth, async (req, res) => {
    try {
        const { transcriptId, parts } = req.body;

        const cleanParts = parts;
        const transcript = await Transcript.findById(transcriptId);
        if (!transcript) {
            throw new Error('Transcript not found');
        }

        const sortedParts = [...cleanParts].sort((a, b) => a.PartNumber - b.PartNumber);
        const expectedPartsCount = Math.ceil(transcript.fileSize / (5 * 1024 * 1024));

        if (sortedParts.length !== expectedPartsCount) {
            throw new Error(`Parts count mismatch. Expected ${expectedPartsCount} parts, but received ${sortedParts.length} parts.`);
        }

        for (let i = 0; i < sortedParts.length; i++) {
            if (sortedParts[i].PartNumber !== i + 1) {
                throw new Error(`Missing part ${i + 1}. Parts must be sequential.`);
            }
        }

        const completeCommand = new CompleteMultipartUploadCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: transcript.s3Key,
            UploadId: transcript.uploadId,
            MultipartUpload: { Parts: sortedParts }
        });

        await s3Client.send(completeCommand);
        transcript.uploadStatus = 'UPLOAD_COMPLETED';
        await transcript.save();

        res.json({
            message: 'Upload completed successfully',
            transcriptId: transcript._id
        });

    } catch (error) {
        console.error('Error in complete-upload:', error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

// Abort multipart upload
router.post('/abort-upload', auth, async (req, res) => {
    try {
        const { uploadId, s3Key, transcriptId, projectId, deleteFromS3 } = req.body;
        
        // First, abort the multipart upload in S3
        if (uploadId && s3Key) {
            const abortCommand = new AbortMultipartUploadCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                UploadId: uploadId
            });
            await s3Client.send(abortCommand);
        }

        // Delete the object from S3 if requested
        if (deleteFromS3 && s3Key) {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key
            });
            await s3Client.send(deleteCommand);
        }

        // Handle transcript and project cleanup
        if (transcriptId && projectId) {
            // Update the specific project to remove the transcript
            await Project.findByIdAndUpdate(
                projectId,
                { $pull: { transcripts: transcriptId } }
            );
            
            // Delete the transcript
            await Transcript.findByIdAndDelete(transcriptId);
        }

        res.json({ message: 'Upload aborted and cleaned up successfully' });
    } catch (error) {
        console.error('Error in abort-upload:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to transcribe the file
router.post('/transcribe/:transcriptId', auth, async (req, res) => {
    try {
        const transcript = await Transcript.findById(req.params.transcriptId);
        if (!transcript) {
            return res.status(404).json({ error: 'Transcript not found' });
        }

        const { fileUrl, transcribeMethod, transcribeLang, transcribeSpeakerNumber } = req.body;

        try {
            transcript.uploadStatus = 'TRANSCRIBING';
            await transcript.save();

            const processedTranscript = await processTranscript({
                fileUrl: fileUrl || transcript.s3Url,
                transcriptId: transcript._id,
                transcribeMethod: transcribeMethod || 'aws',
                transcribeLang: transcribeLang || 'en-US',
                transcribeSpeakerNumber: transcribeSpeakerNumber || 2
            });

            transcript.text = processedTranscript;
            transcript.uploadStatus = 'PROCESSED';
            await transcript.save();

            res.json({
                message: 'Transcript processed successfully',
                transcriptId: transcript._id
            });
        } catch (error) {
            transcript.uploadStatus = 'TRANSCRIBING_FAILED';
            await transcript.save();
            throw error;
        }
    } catch (error) {
        console.error('Error in transcribe:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to generate questions
router.post('/generate-transcript-questions/:transcriptId', auth, async (req, res) => {
    try {
        const transcript = await Transcript.findById(req.params.transcriptId);
        if (!transcript) {
            return res.status(404).json({ error: 'Transcript not found' });
        }

        try {
            transcript.uploadStatus = 'GENERATING_QUESTIONS';
            await transcript.save();

            const questions = await generateTranscriptQuestions(transcript._id);
            console.log(questions, "questions generated");

            transcript.questions = questions;
            transcript.uploadStatus = 'READY_TO_USE';
            await transcript.save();

            res.json({
                message: 'Questions generated successfully',
                transcriptId: transcript._id
            });
        } catch (error) {
            transcript.uploadStatus = 'QUESTION_GENERATION_FAILED';
            await transcript.save();
            throw error;
        }

    } catch (error) {
        console.error('Error in generate-transcript-questions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this endpoint
router.delete('/:transcriptId', auth, async (req, res) => {
    try {
        const { transcriptId } = req.params;
        const transcript = await Transcript.findById(transcriptId);
        
        if (!transcript) {
            return res.status(404).json({ error: 'Transcript not found' });
        }

        // Delete from S3 if file exists
        if (transcript.s3Key) {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: transcript.s3Key
            });
            await s3Client.send(deleteCommand);
        }

        // Remove transcript reference from project
        await Project.findByIdAndUpdate(
            transcript.projectId,
            { $pull: { transcripts: transcriptId } }
        );

        // Delete the transcript
        await Transcript.findByIdAndDelete(transcriptId);

        res.json({ message: 'Transcript deleted successfully' });
    } catch (error) {
        console.error('Error deleting transcript:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this endpoint
router.put('/:transcriptId', auth, async (req, res) => {
    try {
        const { transcriptId } = req.params;
        const { transcriptName, metadata } = req.body;

        const transcript = await Transcript.findByIdAndUpdate(
            transcriptId,
            { 
                transcriptName,
                metadata,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!transcript) {
            return res.status(404).json({ error: 'Transcript not found' });
        }

        res.json(transcript);
    } catch (error) {
        console.error('Error updating transcript:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;