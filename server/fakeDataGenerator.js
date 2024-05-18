const {faker} = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongoose').Types; // Import ObjectId from mongoose
const User = require('./models/user');
const Post = require('./models/post');
const Comment = require('./models/comment');
const axios = require('axios');


const mongoose = require('mongoose');
const post = require('./models/post');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
};

connectDB();


// Generate fake users
const generateUsers = (numUsers) => {
    const users = [];
    for (let i = 0; i < numUsers; i++) {
        const user = {
            _id: new ObjectId(),
            username: faker.internet.userName(),
            email: faker.internet.email(),
            password: faker.internet.password(),
            profile_picture: faker.image.avatar(),
            dateOfBirth: faker.date.past(),
            gender: faker.helpers.arrayElement(['male', 'female', 'other'])

        };
        users.push(user);
    }
    return users;
};

// Generate fake posts
const generatePosts = (numPosts, userIds) => {
    const posts = [];
    for (let i = 0; i < numPosts; i++) {
        const post = {
            _id: new ObjectId(),
            userId: faker.helpers.arrayElement(userIds),
            content: faker.lorem.paragraph(),
            picture: faker.image.url(),
            createdAt: faker.date.recent(),
            likes: [],
            likeCount:0
        };
        posts.push(post);
    }
    return posts;
};

// Generate fake comments
const generateComments = (numComments, userIds, postIds) => {
    const comments = [];
    for (let i = 0; i < numComments; i++) {
        const comment = {
            _id: new ObjectId(),
            userId: faker.helpers.arrayElement(userIds),
            postId: faker.helpers.arrayElement(postIds),
            content: faker.lorem.sentence(),
            createdAt: faker.date.recent(),
            likes: []
        };
        comments.push(comment);
    }
    return comments;
};

// Function to generate random likes for posts
const generatePostLikes = (posts, userIds) => {
    posts.forEach(post => {
        // Generate a random number of likes for each post (between 0 and the total number of users)
        const numLikes = faker.number.int({ min: 0, max: userIds.length });
        post.likeCount=0;
        for (let i = 0; i < numLikes; i++) {
            const randomUserId = faker.helpers.arrayElement(userIds);
            // Ensure the same user doesn't like the post multiple times
            if (!post.likes.includes(randomUserId)) {
                post.likes.push(randomUserId);
                post.likeCount += 1;
            }
        }
    });
};

// Function to generate random likes for comments
const generateCommentLikes = (comments, userIds) => {
    comments.forEach(comment => {
        // Generate a random number of likes for each comment (between 0 and the total number of users)
        const numLikes = faker.number.int({ min: 0, max: userIds.length });
        // Randomly select user IDs to like the comment
        for (let i = 0; i < numLikes; i++) {
            const randomUserId = faker.helpers.arrayElement(userIds);
            // Ensure the same user doesn't like the comment multiple times
            if (!comment.likes.includes(randomUserId)) {
                comment.likes.push(randomUserId);
                
            }
        }
    });
};

const ensureDirectoryExists = (directory) => {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
};

const saveProfilePictures = async (users) => {
    for (const user of users) {
        const profilePictureUrl = user.profile_picture;
        const profilePicturePath = path.join(__dirname, `profile_pictures/${user._id}.jpg`);
        ensureDirectoryExists(path.dirname(profilePicturePath)); // Ensure directory exists
        try {
            const response = await axios.get(profilePictureUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(profilePicturePath, response.data);
          
            user.profile_picture = `${user._id}.jpg`;
        } catch (error) {
            console.error(`Error downloading profile picture for user ${user._id}:`, error.message);
        }
    }
};

// Function to save post pictures
const savePostPictures = async (posts) => {
    for (const post of posts) {
        const postPictureUrl = post.picture;
        const postPicturePath = path.join(__dirname, `post_pictures/${post._id}.jpg`);
        ensureDirectoryExists(path.dirname(postPicturePath)); // Ensure directory exists
        try {
            const response = await axios.get(postPictureUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(postPicturePath, response.data);
            
            post.picture = `${post._id}.jpg`;
        } catch (error) {
            console.error(`Error downloading post picture for post ${post._id}:`, error.message);
        }
    }
};



const numUsers = 20;
const numPosts = 60;
const numComments = 400;

(async () => {
    const users = generateUsers(numUsers);
    const userIds = users.map(user => user._id);
    const posts = generatePosts(numPosts, userIds);
    const postIds = posts.map(post => post._id);
    const comments = generateComments(numComments, userIds, postIds);

    generatePostLikes(posts, userIds);
    generateCommentLikes(comments, userIds);

    // Save profile pictures and post pictures
    await saveProfilePictures(users);
    await savePostPictures(posts);

    const saveUsersToDB = async () => {
        try {
            await User.insertMany(users);
            console.log('Users saved to the database successfully!');
        } catch (error) {
            console.error('Error saving users to the database:', error);
        }
    };

    const savePostsToDB = async () => {
        try {
            await Post.insertMany(posts);
            console.log('Posts saved to the database successfully!');
        } catch (error) {
            console.error('Error saving posts to the database:', error);
        }
    };

    const saveCommentsToDB = async () => {
        try {
            await Comment.insertMany(comments);
            console.log('Comments saved to the database successfully!');
        } catch (error) {
            console.error('Error saving comments to the database:', error);
        }
    };

    // Call functions to save users, posts, and comments to the database
    await saveUsersToDB();
    await savePostsToDB();
    await saveCommentsToDB();

    console.log('Data generated successfully!');
})();
