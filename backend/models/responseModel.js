// backend/models/responseModel.js
const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    // Which transcript is this response tied to?
    transcriptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transcript',
      required: true,
    },
    // Which question does this response answer?
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    // The actual text for the response
    response: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Response', responseSchema);
