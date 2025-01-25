const mongoose = require('mongoose');

const botSessionSchema = new mongoose.Schema({
    bot_id: {
        type: String,
        required: true,
        index: true
    },
    meeting_url: {
        type: String,
        required: true
    },
    meeting_url: {
        type: String,
        required: true
    },
    meeting_name: {
        type: String,
        required: true
    },
    transcript: {
        type: Array,
      default: []
    },
    transcript: {
        type: Array,
      default: []
    },
    speakers: {
        type: Array,
      default: []
    },
    awsMeetingId: {
        type: String,
        default: null
    },
    status: {
        code: {
            type: String
        },
        created_at: {
            type: Date
        }
    },
    recording_url: String,
    transcript_url: String,
    logs: {
        type: Array,
      default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BotSession', botSessionSchema);; 