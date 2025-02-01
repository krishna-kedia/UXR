const mongoose = require('mongoose');

const botSessionSchema = new mongoose.Schema({
    meeting_url: {
        type: String,
        required: true
    },
    botId: {
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
            type: String,
            enum: ['joining_call', 'in_waiting_room', 'in_call_not_recording', 'in_call_recording', 'call_ended'],
            default: 'joining_call'
        },
        created_at: {
            type: Date
        }
    },
    recording_url: String,
    transcript_url: String,
    logs: [{
        status: {
            code: String,
            created_at: Date
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('BotSession', botSessionSchema);; 