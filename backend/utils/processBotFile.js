const Transcript = require('../models/transcriptModel');
require('dotenv').config();
const PYTHON_API_ROOT = process.env.PYTHON_API_ROOT;
/**
 * Process a bot recording file
 * @param {Object} params - The parameters for processing
 * @param {string} params.botUrl - URL of the bot recording
 * @param {string} params.s3FilePath - S3 path where file will be stored
 * @param {string} params.transcriptId - ID of the associated transcript
 * @returns {Promise<Object>} - Processed data
 * @throws {Error} - If processing fails
 */

const text = `spk_0: Hey, uh, good evening.
spk_1: I need us, how are
spk_0: you? Get him? Hi, I'm good. How are you? I'm sorry, I kind of like got stuck with some work, so I ended up like weed like on the way, but if it's fine for you, I can still like give you my time from here. I just turn off my video so it's easy for you and I can focus on the road.
spk_1: Yeah, yeah, please, please, please, uh, you want to connect after some time because,
spk_0: uh, I am OK with that, but then if you guys want like, uh, this to be like just a conversation I can.
spk_0: And spend my time because I know I'm just still driving.
spk_0: Because I'm kind of like on my way from Gurga to Delhi, it's gonna be a long time anyways.
spk_1: So you're OK, right? Like your full focus would be on driving, I hope. Yeah, yeah, how are you. All
spk_0: good, all good. So hope you're doing like, are you doing a road trip or are you traveling for some uh like work like you like to do?
spk_0: I don't. I hate it, but yeah,
spk_1: I mean, I like to, I like to go on a car ride, especially bikes. I do love to travel by bike wherever I go, maybe Hill Station. I always rent a bike and go and travel. So,
spk_0: I always prefer having friends like you because then these are the people who like willing to drive and then I just prefer like the backenger makes sense, makes sense,
spk_1: so
spk_0: yeah, a lot of time.
spk_0: Huh?
spk_0: I'm saying you've recently joined them as a product manager.
spk_1: No, no, no, I'm not a PA. I'm a product designer and I have been here. Yeah, I'm a 1.5 years it's been
spk_0: so you worked on the shop and all. Yeah, everything you see on the platform, it's my work. Oh, man. Thank you. Yeah,
spk_1: yeah, yeah, means a lot. So thanks again for uh squeezing your time on a busy.
spk_1: Um, so let's make it quick. I have a few questions for you with, uh, which are related to your journey at Grothex, OK?
spk_1: So I have uh all the questions and we'll be quick, not gonna take a long time. Maybe you can also summarize your answer in a quick way. So, uh, just wanted to know, uh, so getting started, just wanted to know how did you discover Growthex in general?
spk_0: Protex, I think, uh, a lot of my friends were kind of like just talking about it. I got to know about it from a few Bangalore friends as well because it's mostly famous, I think around Bangalore, and then I kind of like spent my initial years of my career in Bangalore. So I have a lot of friends.
spk_0: From that area who ended up talking about it and then I
spk_0: Got to know about around about you guys around GX7. My friend kind of joined you guys. I was thinking of joining around that time, but then I had the prior prior coverage on. So I ended up like pushing it and then I kind of like just joined like around 3X190. So it took a lot of time.
spk_1: Understood.
spk_0: So,
spk_1: got it, got it, got it. So did you explore any other uh platforms before uh joining Growthex?
spk_0: Not really. This was the only place that I can like, uh, where I kind of felt like, uh, the same sort of an energy and it resonated, so I was like, yeah, let's give it a try.
spk_1: Amazing, amazing. So what was the goal of joining Growthex by the way?
spk_0: For me, I think, uh, just like learning and unlearning a few things at the same point, uh, I wanted to basically like uh.
spk_0: Uh, I've been in the same sort of a job for like a few years now, so it was getting a little monotonous, and I wanted to like try out a few more things and experience a few more things, and that that was basically the idea behind it. Also, I always like thought of learning more about the product side of work and understand that because I work as a project manager and product management is a role that I kinda really like in general as to what all they kind of have to.
spk_0: Work on and how they kind of implement different stuff in different phases of product and that was one of the reasons I thought of kind of joining because I knew that, uh, your entire curriculum is built in such a manner where you kind of like give an in-depth understanding of the entire thing before capstone and then capstone is in another game altogether.
spk_1: And
spk_0: that way.
spk_1: Great, great, great. So, uh, understood. So may I know what uh were your expectations from Grothex when you joined?
spk_0: Uh, frankly, I didn't have like a lot of expectations. Uh, my idea was just to like, first of all, meet new folks because I really like having conversations with people who very different sort of an outlook towards the same problem because my major work is problem solving.
spk_0: So when I got to know about growth, I heard about this community where people are kind of like this from different, uh, genre, different backgrounds, but everyone's main idea is to obviously work on the problem in a different manner. And so yeah, I think that was one of the reasons why I felt like it's a great place. Secondly, I think like I mentioned product management is something that I'm really interested in, and I thought of, I thought maybe like that would give me like some proof of work.
spk_0: That I can maybe use for product manager roles and give me more understanding or a deeper understanding of what I can put into the process.
spk_1: OK, got it, got it. So have you been able to use this learning anywhere, uh, in like a real world
spk_0: product?
spk_0: So not like really the same journey, but then yeah, a few of the things that I've kind of learned I've used like in my existing projects and all, but then uh.
spk_0: I haven't really like gotten a chance to work on a product directly because I come from a service industry, so there are we basically like like I currently work for a marketing agency. So here we just help out different brand with their, uh, product and how they can kind of like have a deeper penetration and try out things. So we've kind of given them suggestions and tried implementing a few things, but then not to the level that I would expect.
spk_0: After kind of growthing, so that is something that I'm still looking for, but then I still have all the learning and then whenever I can get a, get a chance to implement it on a product, I'd be more than happy.
spk_1: Understood, it's understood. So, uh, did you know any Grothex members before joining Growthex?
spk_0: Yeah, I had a few friends uh in different uh project patches.
spk_1: OK.
spk_1: Yeah, so, before joining Grothex, you were in contact with them, right?
spk_0: Yeah, I mean they, they explained me what all goes into the entire process or not, but,
spk_1: uh, understood, understood.
spk_1: So I just wanted to know if within your circle, maybe your LinkedIn circle of friends circle who are into growth and product or maybe are elevated towards growth and all the things that Grothex has to offer, right? So, uh, what do you think? What kind of people falling under any personas would be, um, would be able to get the most benefit out of GrowthX? Like what kind of people would you uh refer Growthex to?
spk_1: In your circle.
spk_1: Like what would be that
spk_0: one.
spk_0: Frankly, anyone who has a hunger to learn more, right, is, uh, or will be the right person for it because at the end of the day it demands a lot of time from your existing life, OK, and, uh, at least for that 4 or 5 weeks or let's say 2 months, right, you need to give it your entire thing and it takes a toll eventually because, uh, you reach out, you reach a point where you have to say no to like hanging out with friends and all around that week only.
spk_0: So that is something that I think only people who are actually willing to learn and try new things, right, would be interested in and can actually do that otherwise I feel uh people kind of like get uh stuck majorly over there. Hm.
spk_1: So have you referred anyone within your circle?
spk_0: So all majorly all my close friends are already aware of that and uh have either been a part of it or are already thinking about it but uh yeah it's referring is something that maybe like where we can like started a conversation about projects and told them about the our experience and all, but then I'm not really referred referred person directly using the platform at all. Oh,
spk_1: OK, OK. Understood, understood.
spk_1: So, uh, coming to the last question, uh, it is with respect to the goal that you have mentioned earlier. So, what is your current goal in your career that you want to achieve?
spk_0: Same, I think, uh, like right now I'm kind of like just finishing my existing project and all and then once these are like, uh, over, right, then I'll have some more time for, uh, me to rework on my existing, uh, uh, CV LinkedIn and stuff like that, and then I'll start applying for like some product role. So basically I think that is the next goal for me where I can like maybe transition to a product role if I get a chance. I think I had a word with some my team Rakshik, I think.
spk_0: From your team, uh, where we kind of like give me a rundown of what all can be done, and I implemented a few things. I still haven't like implemented all because like I mentioned, in order for me to start applying, I need, uh, first of all, uh, that sort of a mindset and that time as well and I think the moment that happens then I think I can start looking out for Portuguese.
spk_1: Got it, got it, got it. Understood.
spk_1: Um, so yeah, that's it. Thanks a lot for your time. Uh, I hope you are focusing on the road the entire time. Uh, so do you have any general feedback that you would like to give about growth on your journey, maybe something that you didn't like or wanted to improve? Do you have any such valuable insights for us that we can work on?
spk_0: I think you guys are already very, uh, doing pretty great and you're very fast at, uh, picking up feedback. I don't know because last last time when I kind of gave some feedback, I just remember I mentioned about having some sort of a lesson for growth model because that is one bit where we struggled around our capital because initially all your classes are like acquisition and uh monetization and stuff like that, right engagement and retention.
spk_0: But none of the classes were specifically for growth model, but now I think.
spk_0: Uh, uh, growth, uh, growth model as well. Yes, well, I think now that that part is already there. I think it will be, it'll be helpful for people who kind of like maybe try for capstone again because then you don't need to again learn more and more about, uh, growth model. You can simply go through the lessons and use it.
spk_1: Got it.
spk_1: Hi, are you, are you here?
spk_0: Yeah, yeah, can you hear
spk_0: me?
spk_1: Yeah, yeah, I can hear you. I can hear you. Yeah, so, um, I think that would be it. Uh, we can conclude the call and thanks a lot for joining on Saturday. Um, thanks a lot.
spk_0: I hope I was helpful. I'm so sorry. I kind of got stuck with traffic
spk_0: and
spk_1: then I couldn't reach home by this time. I was expecting. Yeah, yeah, I have taken a note of everything that you have mentioned that would definitely be helpful, like, uh, like a million times helpful. So thanks a lot, Neeraj.
spk_0: Uh,
spk_1: you have a good trip and
spk_0: a great weekend. Bye bye. Bye
spk_1: bye. Have a nice trip. Bye.
spk_0: You too bye bye, bye, thanks.`

async function uploadToS3({ botUrl, s3FilePath, sessionId }) {
    try {
        const uploadResponse = await fetch(`${PYTHON_API_ROOT}/upload-s3file-to-s3bucket/${sessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_url: botUrl,
                s3_file_path: s3FilePath
            })
        });

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(JSON.stringify({
                message: 'Failed to upload to S3',
                status: uploadResponse.status,
                statusText: uploadResponse.statusText,
                apiError: errorData.detail || 'Unknown upload error'
            }));
        }

        return await uploadResponse.json();
    } catch (error) {
        console.error('Error in uploadToS3:', error);
        throw error;
    }
}

async function processTranscript({ 
    fileUrl, 
    transcriptId, 
    transcribeMethod,
    transcribeLang,
    transcribeSpeakerNumber  
}) {
    try {
        // Input validation
        if (!fileUrl || !transcriptId || !transcribeMethod || !transcribeLang || !transcribeSpeakerNumber) {
            throw new Error(JSON.stringify({
                message: 'Missing required parameters',
                details: {
                    fileUrl: fileUrl,
                    transcriptId: transcriptId,
                    transcribeMethod: transcribeMethod,
                    transcribeLang: transcribeLang,
                    transcribeSpeakerNumber: transcribeSpeakerNumber
                }
            }));
        }

        // const response = await fetch(`${PYTHON_API_ROOT}/transcribe-file/${transcriptId}`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         url: fileUrl,
        //         transcribe_method: transcribeMethod,
        //         transcribe_lang: transcribeLang,
        //         transcribe_speaker_number: transcribeSpeakerNumber
        //     })
        // });

        // if (!response.ok) {
        //     const errorData = await response.json();
        //     throw new Error(JSON.stringify({
        //         message: 'Failed to transcribe file',
        //         status: response.status,
        //         statusText: response.statusText,
        //         apiError: errorData.detail || 'Unknown transcription error'
        //     }));
        // }

        // const data = await response.json();
        // return data.transcript;
        return text;

    } catch (error) {
        console.error('Error in processTranscript:', error);
        throw error;
    }
}

async function generateTranscriptQuestions(transcriptId) {
    try {
        // Input validation
        if (!transcriptId) {
            throw new Error(JSON.stringify({
                message: 'Missing transcript ID',
                details: { transcriptId: !transcriptId }
            }));
        }

        const response = await fetch(`${PYTHON_API_ROOT}/generate-transcript-questions/${transcriptId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(JSON.stringify({
                message: 'Failed to generate transcript questions',
                status: response.status,
                statusText: response.statusText,
                apiError: errorData.detail || 'Unknown error in question generation'
            }));
        }

        const data = await response.json();
        return data.questions;

    } catch (error) {
        console.error('Error in generateTranscriptQuestions:', error);
        throw error;
    }
}

module.exports = {
    uploadToS3,
    processTranscript,
    generateTranscriptQuestions
};