# Social Media App

This is a full-stack social media application built with React, Node.js, Express, and MongoDB. It allows users to register, create posts, edit their profiles, and interact with other users' posts.

## Features

- **User Registration:** Users can register with a username, email, password, date of birth, gender, and profile picture.
- **Post Creation and Editing:** Users can create posts with text content and an optional picture. They can also edit their posts later.
- **Profile Management:** Users can view and edit their profile information, including username, email, date of birth, gender, and profile picture.
- **Infinite Scroll Pagination:** The profile page implements infinite scroll pagination for loading more posts as the user scrolls down.
- **Post Sorting:** Users can sort posts by newest or most liked on their profile page.

## Installation

1. Clone the repository:

2. Install dependencies for the client and server:

cd MERN-Social-Media/client

npm install

cd ../server

npm install

3. Start the client and server:

cd ../client

npm run dev

cd ../server

npm start

4. This project uses environment variables for configuration.

PORT=8888

MONGODB_URI=mongodb://localhost:27017/

SECRETKEY=your_secret

5. Create necessary directories

Create /server/post_pictures and /server/profile_pictures directories

6. (Optional) use fakeDataGenerator.js for fake data

npm fakeDataGenerator.js

7. Access the application at `http://localhost:3000` in your browser.

## Technologies Used

- React
- Node.js
- Express
- MongoDB
- Axios
- React Router
- CSS Modules

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.