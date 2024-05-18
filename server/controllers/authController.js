const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const moment = require('moment');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// Function to check if the file type is valid
const isValidFileType = (file) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  return allowedExtensions.includes(fileExtension);
};

// Register a new user
exports.register = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Remove uploaded file if validation fails
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error('Error deleting uploaded file:', err);
          }
        });
      }
      return res.status(400).json({ message: errors.array() });
    }
    
    // Check if profile picture is provided
    if (!req.file) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    // Validate file type
    if (!isValidFileType(req.file)) {
      return res.status(400).json({ message: "Invalid file type. Only JPG, JPEG, PNG, and GIF files are allowed" });
    }
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create new user instance
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
      email: req.body.email,
      profile_picture: req.file.path,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender
    });

    // Save user to database
    await user.save();
    const userId = user._id;
    const newFilename = userId + path.extname(req.file.originalname);

    // Rename the file with the new filename
    fs.rename(req.file.path, path.join('profile_pictures/', newFilename), async function(err) {
      if (err) {
        console.error('Error renaming file:', err);
        return res.status(500).json({ message: 'Error creating post' });
      }
      console.log('File renamed successfully');

      // Update the post in the database with the new filename
      user.profile_picture = newFilename;
      await user.save();
    });

    // Generate JWT token
    const token = jwt.sign({ _id:user._id, email: user.email }, process.env.SECRETKEY);
    return res.status(200).json({ token });
  } catch (error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error(error);
    res.status(500).send("Error registering user");
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Compare passwords
    if (await bcrypt.compare(req.body.password, user.password)) {
      // Generate JWT token
      const token = jwt.sign({ _id:user._id,email: user.email }, process.env.SECRETKEY);
      return res.status(200).json({ token });
    } else {
      return res.status(401).send("Invalid password");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging in");
  }
};

// Validation middleware for user registration
exports.validateRegistration = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email').isEmail().withMessage('Email must be a valid email address'),
  body('password').isLength({ min: 7 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$^!%*?&#])[A-Za-z\d@$^!%*?&#]{7,}$/)
    .withMessage('Password must be at least 7 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('dateOfBirth').isDate().custom((value) => {
    const dob = new Date(value);
    const age = Math.floor((new Date() - dob) / (1000 * 60 * 60 * 24 * 365));
    if (age < 13) {
      throw new Error('You must be at least 13 years old to register');
    }
    return true;
  }).withMessage('user must be at least 13 years old'),
];
