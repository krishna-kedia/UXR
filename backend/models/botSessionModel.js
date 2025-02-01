const mongoose = require('mongoose');

const botSessionSchema = new mongoose.Schema({
    meeting_url: {
        type: String,
        required: true
    },
    meeting_name: {
        type: String,
        required: true
    },
    webhook_url: {
        type: String,
        required: true
    },
    botId: String,
    status: {
        code: {
            type: String,
            enum: ['joining_call', 'in_waiting_room', 'in_call_not_recording', 'in_call_recording', 'call_ended', 'error'],
            default: 'joining_call'
        },
        created_at: {
            type: Date
        }
    },
    eventLogs: [{
        type: {
            type: String,
            enum: ['status_change', 'complete', 'error']
        },
        status: {
            code: String,
            created_at: Date
        },
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    recording_url: String,
    speakers: Array,
    transcript: Array
}, {
    timestamps: true
});

module.exports = mongoose.model('BotSession', botSessionSchema); 