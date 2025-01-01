// backend/models/transcriptModel.js
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
    content: {
      type: Buffer,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transcript', transcriptSchema);
