const Comment = require('../models/comment');
const { body, validationResult } = require('express-validator');

// Create a new comment
exports.createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId } = req.params;
    const { content } = req.body;

    // Create a new comment instance
    const comment = new Comment({
      postId,
      content,
      userId: req.user._id // Assuming you have user authentication middleware
    });

    // Save the comment to the database
    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment' });
  }
};

// Get all comments for a certain post by id
exports.getCommentsByPostId = async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({ postId });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

// Like or unlike a comment
exports.likeComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.body.userId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the user already liked the comment
    const alreadyLikedIndex = comment.likes.findIndex(id => id.toString() === userId);

    if (alreadyLikedIndex !== -1) {
      // User already liked the comment, so remove their ID from the likes array
      comment.likes.splice(alreadyLikedIndex, 1);
    } else {
      // Like the comment
      comment.likes.push(userId);
    }

    // Save the updated comment
    await Comment.updateOne({ _id: commentId }, { likes: comment.likes });

    res.json({ message: 'Comment liked/unliked successfully' });
  } catch (error) {
    console.error('Error liking/unliking comment:', error);
    res.status(500).json({ message: 'Error liking/unliking comment' });
  }
};

// Get a comment by its id
exports.getCommentById = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ message: 'Error fetching comment' });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  const commentId = req.params.commentId;

  try {
    const deletedComment = await Comment.findOneAndDelete({ _id: commentId, userId: req.user._id });

    // Check if the comment exists
    if (!deletedComment) {
      return res.status(404).json({ message: 'Comment not found or you are not authorized to delete this comment' });
    }
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

// Edit a comment
exports.editComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { content } = req.body;
    const commentId = req.params.commentId;

    // Find the comment by ID and update it
    const updatedComment = await Comment.findOneAndUpdate(
      { _id: commentId, userId: req.user._id }, // Find the comment by its ID and owner
      { $set: { content: content } }, // Update the content field
      { new: true } // Return the updated comment
    );

    // Check if the comment exists
    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found or you are not authorized to edit this comment' });
    }

    // Return the updated comment
    res.json(updatedComment);
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Validation middleware for comment creation
exports.validateComment = [
  body('content').isLength({ min: 3 }).withMessage('Content must have at least 3 characters')
];
