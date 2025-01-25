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
    content: {  // Store original file content as Buffer
      type: Buffer,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    text: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      required: true
    },
    ActiveQuestionsAnswers: {
      type: Object,
      default: {}
    },
    PastQuestionsArray: {
      type: Array,
      default: []
    },
    // file: {
    //   type: File, 
    //   default: null
    // },
    origin: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transcript', transcriptSchema);