const BotSession = require('../models/botSessionModel');

class BotPollingService {
    constructor() {
        this.activePolls = new Map();
        this.MAX_POLL_TIME = 24 * 60 * 60 * 1000; // 24 hours
        this.POLL_INTERVAL = 30 * 1000; // 30 seconds
        this.MAX_ERROR_COUNT = 50; // Maximum allowed errors
        console.log('🚀 BotPollingService initialized');
    }

    async startPolling(botSession) {
        console.log(`\n🔄 Starting polling for bot session: ${botSession._id}`);
        console.log(`📍 Webhook URL: ${botSession.webhook_url}`);
        
        const startTime = Date.now();
        
        const pollFunction = async () => {
            try {
                console.log(`\n📡 Polling attempt for session ${botSession._id}`);
                
                // Check if polling should continue
                const updatedSession = await BotSession.findById(botSession._id);
                console.log(`✓ Session polling status: ${updatedSession.isPolling}`);
                
                if (!updatedSession.isPolling) {
                    console.log('❌ Polling stopped: isPolling is false');
                    this.stopPolling(botSession._id);
                    return;
                }

                // Check error count
                if (updatedSession.errorCount >= this.MAX_ERROR_COUNT) {
                    console.log('⚠️ Maximum error count reached');
                    await this.stopPollingWithError(botSession._id, 'Maximum error count exceeded');
                    return;
                }

                // Check max time
                if (Date.now() - startTime > this.MAX_POLL_TIME) {
                    console.log('⏰ Maximum polling time exceeded');
                    await this.stopPollingWithLog(botSession._id, 'Maximum polling time exceeded');
                    return;
                }

                // Log poll attempt
                await BotSession.findByIdAndUpdate(botSession._id, {
                    $push: { 
                        pollingLogs: {
                            type: 'poll_attempt',
                            message: 'Polling webhook for status update',
                            timestamp: new Date()
                        }
                    },
                    lastPollTime: new Date()
                });
                console.log('📝 Poll attempt logged');

                // Make POST request
                console.log('🔄 Making webhook request...');
                const response = await this.pollWebhook(botSession.webhook_url);
                console.log('📥 Webhook response:', JSON.stringify(response, null, 2));
                
                if (response.event === 'complete') {
                    console.log('✅ Received complete event');
                    await this.stopPollingWithLog(botSession._id, 'Meeting completed');
                }

                // Reset error count on successful poll
                await BotSession.findByIdAndUpdate(botSession._id, {
                    errorCount: 0
                });

            } catch (error) {
                console.error('❌ Polling error:', error.message);
                
                // Increment error count and log error
                const updatedSession = await BotSession.findByIdAndUpdate(
                    botSession._id,
                    {
                        $inc: { errorCount: 1 },
                        $push: { 
                            pollingLogs: {
                                type: 'poll_error',
                                message: `Polling failed: ${error.message}`,
                                timestamp: new Date()
                            }
                        }
                    },
                    { new: true }
                );

                // Check if max errors reached after increment
                if (updatedSession.errorCount >= this.MAX_ERROR_COUNT) {
                    await this.stopPollingWithError(botSession._id, 'Maximum error count exceeded');
                    return;
                }

                // Retry once
                try {
                    console.log('🔄 Attempting retry...');
                    await BotSession.findByIdAndUpdate(botSession._id, {
                        $push: { 
                            pollingLogs: {
                                type: 'poll_retry',
                                message: 'Retrying failed poll',
                                timestamp: new Date()
                            }
                        }
                    });

                    const retryResponse = await this.pollWebhook(botSession.webhook_url);
                    console.log('📥 Retry response:', JSON.stringify(retryResponse, null, 2));
                } catch (retryError) {
                    console.error('❌ Retry failed:', retryError.message);
                    await BotSession.findByIdAndUpdate(botSession._id, {
                        $push: { 
                            pollingLogs: {
                                type: 'poll_error',
                                message: `Retry failed: ${retryError.message}`,
                                timestamp: new Date()
                            }
                        }
                    });
                }
            }
        };

        // Start polling
        console.log(`⏱️ Setting up polling interval: ${this.POLL_INTERVAL}ms`);
        const intervalId = setInterval(pollFunction, this.POLL_INTERVAL);
        this.activePolls.set(botSession._id.toString(), intervalId);
        console.log(`✅ Polling started for session ${botSession._id}`);
    }

    async stopPollingWithError(botSessionId, reason) {
        console.log(`\n🛑 Stopping polling due to error for session ${botSessionId}`);
        console.log(`📝 Reason: ${reason}`);
        
        await BotSession.findByIdAndUpdate(botSessionId, {
            isPolling: false,
            'status.code': 'error',
            'status.created_at': new Date(),
            $push: { 
                eventLogs: {
                    type: 'error',
                    message: reason,
                    timestamp: new Date()
                }
            }
        });
        this.stopPolling(botSessionId);
        console.log('✅ Polling stopped due to error');
    }

    async stopPollingWithLog(botSessionId, reason) {
        console.log(`\n🛑 Stopping polling for session ${botSessionId}`);
        console.log(`📝 Reason: ${reason}`);
        
        await BotSession.findByIdAndUpdate(botSessionId, {
            isPolling: false,
            $push: { 
                pollingLogs: {
                    type: 'poll_complete',
                    message: reason,
                    timestamp: new Date()
                }
            }
        });
        this.stopPolling(botSessionId);
        console.log('✅ Polling stopped successfully');
    }

    stopPolling(botSessionId) {
        const intervalId = this.activePolls.get(botSessionId.toString());
        if (intervalId) {
            clearInterval(intervalId);
            this.activePolls.delete(botSessionId.toString());
            console.log(`🧹 Cleaned up polling interval for session ${botSessionId}`);
        }
    }

    async pollWebhook(webhookUrl) {
        console.log(`\n🔄 Making POST request to: ${webhookUrl}`);
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`❌ HTTP error! status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Webhook request successful');
        return data;
    }
}

module.exports = new BotPollingService(); 