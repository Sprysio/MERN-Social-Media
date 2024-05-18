// Import necessary modules
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');

// Multer configuration
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

// Route for user registration with file upload
router.post('/register', upload.single('profile_picture'), authController.validateRegistration, authController.register);

// Route for user login
router.post('/login', authController.login);

// Export the router for use in other modules
module.exports = router;
