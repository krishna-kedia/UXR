// server.js

const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const cors = require('cors');
require('dotenv').config();
const transcriptRoutes = require('./routes/transcripts');
const projectRoutes = require('./routes/projects');
const questionRoutes = require('./routes/questions');
const botRoutes = require('./routes/bot');
const chatRoutes = require('./routes/chat');

const app = express();
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// Make sure body parser is configured
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Connect to MongoDB (replace <YOUR_MONGO_URI> with your real connection string)
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// 2. Basic test route
app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/chat', chatRoutes);
// Add a test route to verify the server is working
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// 3. Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
