// backend/models/questionModel.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    // Link back to the Project that this question belongs to
    projectName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
