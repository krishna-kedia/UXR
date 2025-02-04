const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema(
  {
    transcriptName: {
      type: String,
      required: true,
      trim: true,
    },
    transcriptDate: {
      type: Date,
      default: Date.now,
    },
    lastProcessingDate: {
      type: Date,
    },
    fileType: String,
    fileName: String,
    s3Key: String,
    s3Url: String,
    uploadStatus: {
      type: String,
      enum: ['INITIATING', 'UPLOADING', 'PROCESSING', 'UPLOAD_COMPLETED', 'PROCESSING_FAILED', 'READY_TO_USE', 'SCHEDULED_TO_JOIN', 'MEETING_STARTED', 'MEETING_COMPLETED','BOT_FAILED']
    },
    uploadId: String,
    parts: [{
      partNumber: Number,
      eTag: String,
      size: Number
    }],
    origin: {
      type: String,
      enum: ['user_uploaded', 'meeting_recording']
    },
    metadata: {
      no_of_people: Number,
      interviewer_name: String,
      interviewee_names: String,
      language: String
    },
    text: String,
    questions: {
      type: Object,
      default: {}
    },
    ActiveQuestionsAnswers: {
      type: Object,
      default: {}
    },
    PastQuestionsArray: [{
      dateOfChange: Date,
      qaObject: Object
    }],
    bot_session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BotSession'
    },
    fileSize: {
      type: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transcript', transcriptSchema);