// backend/models/projectModel.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    // An array of Question _ids
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
    
    // The user who created this project
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
