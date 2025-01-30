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
    fileType: {
      type: String,
    },
    text: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TranscriptText'
    },
    fileName: {
      type: String
    },
    ActiveQuestionsAnswers: {
      type: Object,
      default: {}
    },
    PastQuestionsArray: {
      type: Array,
      default: []
    },
    s3Key: {
      type: String,
      default: null
    },
    s3Url: {
      type: String,
      default: null
    },
    // file: {
    //   type: File, 
    //   default: null
    // },
    origin: {
      type: String,
      default: null,
      enum: ['user_uploaded', 'meeting_recording']
    },
    bot_session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BotSession'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transcript', transcriptSchema);