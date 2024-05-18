// Import necessary modules
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  // Set destination for uploaded files
  destination: function (req, file, cb) {
    cb(null, 'profile_pictures/');
  },
  // Set filename for uploaded files
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Routes for user-related actions

// Route to view user profile
router.get('/profile', authMiddleware.authenticate, userController.profile);

// Route to get user by ID
router.get('/:userId', userController.getUserById);

// Route to view user settings
router.get('/settings', authMiddleware.authenticate, userController.getUserSettings);

// Route to update user settings
router.post('/settings', authMiddleware.authenticate, upload.single('profile_picture'), userController.validateEditingSettings, userController.updateUserSettings);

// Route to change user password
router.post('/change-password', authMiddleware.authenticate, userController.validateEditingPassword, userController.changePassword);

// Route to delete user
router.delete('/:userId', authMiddleware.authenticate, userController.deleteUser);

// Export the router for use in other modules
module.exports = router;
