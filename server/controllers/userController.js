const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

// Function to check if the file type is valid
const isValidFileType = (file) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  return allowedExtensions.includes(fileExtension);
};

// Get user profile
exports.profile = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select('-password');
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching user profile");
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user settings
exports.getUserSettings = async (req, res) => {
  try {
    const userId = req.body.userId; // Assuming user is authenticated and userId is available in request
    const user = await User.findById(userId);
    res.json(user);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: 'Error fetching user settings' });
  }
};

// Update user settings
exports.updateUserSettings = async (req, res) => {
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
    if (req.file) {
      if (!isValidFileType(req.file)) {
        return res.status(400).json({ message: "Invalid file type. Only JPG, JPEG, PNG, and GIF files are allowed" });
      }
    }

    const userId = req.body.userId; // Assuming user is authenticated and userId is available in request
    const { username, email, dateOfBirth, gender } = req.body;

    const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Update user settings
    let updateFields = {
      username: username,
      email: email,
      dateOfBirth: dateOfBirth,
      gender: gender
    };
    if (req.file) {
      const newFilename = userId + path.extname(req.file.originalname);

      // Rename the file with the new filename
      fs.rename(req.file.path, path.join('profile_pictures/', newFilename), async function (err) {
        if (err) {
          console.error('Error renaming file:', err);
          return res.status(500).json({ message: 'Error creating post' });
        }
        console.log('File renamed successfully');
      });

      updateFields.profile_picture = newFilename;
    }

    const updatedUser = await User.findByIdAndUpdate(
      { _id: userId },
      { $set: updateFields },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found or you are not authorized to edit this post' });
    }
    res.json({ message: 'User settings updated successfully' });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Error updating user settings' });
  }
};

// Change user password
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { userId, newPassword } = req.body;

    // Update user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a user account
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find user by userId and delete
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Remove likes on posts made by other users
    await Post.updateMany({ userId: { $ne: userId } }, { $pull: { likes: userId },$inc: { likeCount: -1 } });

    // Remove likes on comments made by other users
    await Comment.updateMany({ userId: { $ne: userId } }, { $pull: { likes: userId } });

    // Delete posts associated with the user
    await Post.deleteMany({ userId: userId });

    // Delete comments associated with the user
    await Comment.deleteMany({ userId: userId });

    res.status(200).json({ message: 'User account deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Validation middleware for editing user settings
exports.validateEditingSettings = [
  // Username must be at least 3 characters long
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),

  // Email must be a valid email address
  body('email').isEmail().withMessage('Email must be a valid email address'),

  // Date of Birth must be provided and user must be at least 13 years old
  body('dateOfBirth').isDate().custom((value) => {
    const dob = new Date(value);
    const age = Math.floor((new Date() - dob) / (1000 * 60 * 60 * 24 * 365));
    if (age < 13) {
      throw new Error('You must be at least 13 years old to register');
    }
    return true;
  }).withMessage('User must be at least 13 years old'),
];

// Validation middleware for editing user password
exports.validateEditingPassword = [
  body('password').isLength({ min: 7 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$^!%*?&#])[A-Za-z\d@$^!%*?&#]{7,}$/)
    .withMessage('Password must be at least 7 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];
