const axios = require('axios');

const WEBHOOK_TOKEN = 'a3eaa4fd-179c-4b8b-b771-de5fdfb6a365'; // Your Webhook.site token
const API_URL = `https://api.meetingbaas.com/bots/meeting_data?bot_id=6a433b36-a2e5-4233-b64d-33febca4a9d9`;

async function fetchWebhookData() {
    try {
        const response = await axios.get(API_URL);
        console.log('Received Webhook Data:', response.data);
    } catch (error) {
        console.error('Error fetching webhook data:', error.message);
    }
}

async function krishna(){
    try{
        const kedia = await axios.get(API_URL, {
            headers: {
"x-meeting-baas-api-key": "19fb68f9db2ee701567ac1501a57d9bcc87c09ba70b530fa8a481629280a48f3"
            }
            
        })
        console.log('received data', kedia.data)
    }catch(error){
        console.error('Error fetching webhook data:', error.message);
    }
}

fetch("https://api.meetingbaas.com/bots/meeting_data?bot_id=string", {
    headers: {
      "x-meeting-baas-api-key": "<token>"
    }
  });

// Poll every 5 seconds
setInterval(krishna, 5000);
