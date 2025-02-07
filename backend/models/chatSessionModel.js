const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    chatName: {
        type: String,
        required: true
    },
    transcript_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transcript',
        default: null
    },
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    history: {
        type: Array,
        default: []
    },
    chat_type: {
        type: String,
        enum: ['project', 'transcript'],
        required: true
    },
    delete_time: {
        type: Date,
        default: null
    },
    num_interactions: {
        type: Number,
        default: 0
    },
    conversation: {
        type: Array,
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema); 