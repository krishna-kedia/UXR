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
      type: String
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
    },
    metadata: {
      no_of_people: {
        type: Number,
        required: false
      },
      interviewer_name: {
        type: String,
        required: false
      },
      interviewee_names: {
        type: String,
        required: false
      },
      language: {
        type: String,
        required: false
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transcript', transcriptSchema);