const Post = require('../models/post');
const Comment = require('../models/comment');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// Function to check if the file type is valid
const isValidFileType = (file) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  return allowedExtensions.includes(fileExtension);
};

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error('Error deleting uploaded file:', err);
          }
        });
      }
      return res.status(400).json({ errors: errors.array() });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    // Validate file type
    if (!isValidFileType(req.file)) {
      return res.status(400).json({ message: "Invalid file type. Only JPG, JPEG, PNG, and GIF files are allowed" });
    }

    // Create new post object
    const post = new Post({
      userId: req.body.userId,
      content: req.body.content,
      picture: req.file.path,
    });

    // Save post to the database
    await post.save();

    // Get the postId
    const postId = post._id;

    // Generate new filename with postId
    const newFilename = postId + path.extname(req.file.originalname);

    // Rename the file with the new filename
    fs.rename(req.file.path, path.join('post_pictures/', newFilename), async function(err) {
      if (err) {
        console.error('Error renaming file:', err);
        return res.status(500).json({ message: 'Error creating post' });
      }

      // Update the post in the database with the new filename
      post.picture = newFilename;
      await post.save();

      res.status(201).json({ message: 'Post created successfully' });
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post' });
  }
};

// Get posts with pagination
exports.getPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip(skip)
      .limit(limit)
      .populate('likes') // Populate the 'likes' field to count the number of likes
      .exec();

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

// Get a post by its id
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('likes')
      .exec();
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Like or unlike a post
exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.body.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user already liked the post
    const alreadyLikedIndex = post.likes.findIndex(id => id.toString() === userId);

    if (alreadyLikedIndex !== -1) {
      // User already liked the post, so remove their ID from the likes array
      post.likes.splice(alreadyLikedIndex, 1);
      post.likeCount -= 1;
    } else {
      // Like the post
      post.likes.push(userId);
      post.likeCount += 1;
    }

    // Attempt to update the post with optimistic concurrency control
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId, __v: post.__v }, // Match document by ID and version
      { likes: post.likes ,likeCount:post.likeCount},          // Update the likes array
      { new: true }                   // Return the updated document
    );

    if (!updatedPost) {
      // If the document with the specified version is not found, return an error
      return res.status(409).json({ message: 'Conflict: Post was modified by another user' });
    }

    res.json({ message: 'Post liked/unliked successfully' });
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({ message: 'Error liking/unliking post' });
  }
};

// Get posts by a specific user
exports.getPostsByUser = async (req, res) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    let sortCriteria = { createdAt: -1 }; // Default sorting by createdAt in descending order

    // Check if sorting by likeCount is requested
    if (req.query.sort === 'likeCount') {
      sortCriteria = { likeCount: -1 ,createdAt: -1}; 
    }
    const posts = await Post.find({ userId })
      .sort(sortCriteria) 
      .skip(skip)
      .limit(limit)
      .populate('likes')
      .exec();

    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Error fetching user posts' });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  const postId = req.params.postId;

  try {
    const deletedPost = await Post.findOneAndDelete({ _id: postId, userId: req.user._id });

    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found or you are not authorized to delete this post' });
    }
    await Comment.deleteMany({ postId: postId });
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// Edit a post
exports.editPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error('Error deleting uploaded file:', err);
          }
        });
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const postId = req.params.postId;

    let updateFields = { content: content };

    // Check if a new picture is provided
    if (req.file) {
      if (!isValidFileType(req.file)) {
        return res.status(400).json({ message: "Invalid file type. Only JPG, JPEG, PNG, and GIF files are allowed" });
      }
      const newFilename = postId + path.extname(req.file.originalname);

      // Rename the file with the new filename
      fs.rename(req.file.path, path.join('post_pictures/', newFilename), async function(err) {
        if (err) {
          console.error('Error renaming file:', err);
          return res.status(500).json({ message: 'Error creating post' });
        }
      });

      updateFields.picture = newFilename;
    }
    // Find the post by ID and update it
    const updatedPost = await Post.findByIdAndUpdate(
      { _id: postId, userId: req.user._id }, // Find the post by its ID and owner
      { $set: updateFields }, // Update the content and picture fields
      { new: true } // Return the updated post
    );

    // Check if the post exists
    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found or you are not authorized to edit this post' });
    }

    // Return the updated post
    res.json(updatedPost);
  } catch (error) {
    console.error('Error editing post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Validation middleware for post creation and editing
exports.validatePost = [
  body('content').isLength({ min: 3 }).withMessage('Content must have at least 3 characters')
];
