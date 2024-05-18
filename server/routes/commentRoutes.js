// Import necessary modules
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes for comments

// Route to create a new comment on a post
router.post('/:postId', authMiddleware.authenticate, commentController.validateComment, commentController.createComment);

// Route to get comments by post ID
router.get('/:postId', commentController.getCommentsByPostId);

// Route to like a comment
router.post('/:commentId/like', authMiddleware.authenticate, commentController.likeComment);

// Route to get a comment by its ID
router.get('/comment/:commentId', commentController.getCommentById);

// Route to delete a comment
router.delete('/:commentId', authMiddleware.authenticate, commentController.deleteComment);

// Route to edit a comment
router.post('/:commentId/edit', authMiddleware.authenticate, commentController.validateComment, commentController.editComment);

// Export the router for use in other modules
module.exports = router;
