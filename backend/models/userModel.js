// backend/models/userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: 'user',
      // e.g., enum: ['user', 'admin'], if you want to limit roles
    },
    chatSessions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession'
  }],
    // An array of Project _ids
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
