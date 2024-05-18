// Import necessary modules
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  // Set destination for uploaded files
  destination: function (req, file, cb) {
    cb(null, 'post_pictures/');
  },
  // Set filename for uploaded files
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Routes for posts

// Route to create a new post
router.post('/create', authMiddleware.authenticate, upload.single('picture'), postController.validatePost, postController.createPost);

// Route to load posts
router.get('/load', postController.getPosts);

// Route to get a post by its ID
router.get('/:postId', postController.getPostById);

// Route to like a post
router.post('/:postId/like', authMiddleware.authenticate, postController.likePost);

// Route to get posts by a specific user
router.get('/user/:userId', postController.getPostsByUser);

// Route to delete a post
router.delete('/:postId', authMiddleware.authenticate, postController.deletePost);

// Route to edit a post
router.post('/:postId/edit', authMiddleware.authenticate, upload.single('picture'), postController.validatePost, postController.editPost);

// Export the router for use in other modules
module.exports = router;
