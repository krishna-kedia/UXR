// backend/models/questionModel.js
const mongoose = require('mongoose');

const transcriptTextSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TranscriptText', transcriptTextSchema);
