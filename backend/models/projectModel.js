// backend/models/projectModel.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    transcripts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transcript',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },  
    questionsCreatedDateTime: {
      type: Date,
    },
    pastQuestions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);