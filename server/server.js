// Import necessary modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const path = require('path');
const connectDB  = require('./db');


// Load environment variables from .env file
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(express.json({ limit: '8mb' })); // Limit request body size
app.use('/post_pictures', express.static(path.join(__dirname, 'post_pictures'))); // Serve post pictures statically
app.use('/profile_pictures', express.static(path.join(__dirname, 'profile_pictures'))); // Serve profile pictures statically
app.use(cors()); // Enable CORS for all routes

// Connect to MongoDB
connectDB();



// Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/user', userRoutes); // User-related routes
app.use('/api/posts', postRoutes); // Routes for posts
app.use('/api/comments', commentRoutes); // Routes for comments


// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
