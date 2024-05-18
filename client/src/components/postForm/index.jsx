import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './style.module.css';

const PostForm = () => {
  // State variables
  const [postData, setPostData] = useState({ content: '', picture: null });
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false); // State to track edit mode
  const [currentPicture, setCurrentPicture] = useState('');
  
  // Router hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Effect hook for initial setup
  useEffect(() => {
    const token = localStorage.getItem('token');

    // Redirect to login page if token is not available
    if (!token) {
      navigate('/login');
      return;
    }

    // Check location state for edit mode
    if (location.state && location.state.postData) {
      setPostData(location.state.postData);
      setCurrentPicture(`http://localhost:8888/post_pictures/${location.state.postData.picture}`);
      setIsEditing(true);
    } else if (location.pathname === '/create-post') {
      // Allow access to the create post page
    } else {
      navigate('/');
    }
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    setPostData({ ...postData, [e.target.name]: e.target.value });
  };

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setPostData({ ...postData, picture: selectedFile });

      // Set current picture preview
      const reader = new FileReader();
      reader.onload = () => {
        setCurrentPicture(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      // Redirect to login page if token is not available
      if (!token) {
        navigate('/login');
        return;
      }

      // Validate content length
      if (postData.content.length < 3) {
        setError('Content must be at least 3 characters long');
        return;
      }

      // Validate picture type
      if (postData.picture instanceof File && postData.picture.type) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(postData.picture.type)) {
          setError('Invalid file type. Only JPG, PNG, and GIF files are allowed');
          return;
        }
      }

      setError('');

      // Get user ID from token
      const user = JSON.parse(atob(token.split('.')[1]));

      // Determine API URL based on edit mode
      let url = 'http://localhost:8888/api/posts/create';
      if (isEditing) {
        url = `http://localhost:8888/api/posts/${postData._id}/edit`;
      }

      // Send POST request to create/update post
      const response = await axios.post(
        url,
        { userId: user._id, ...postData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      // Redirect to home page after successful post creation/update
      window.location.href= `/`
    } catch (error) {
      console.error('Error creating/updating post:', error);

      // Handle different types of errors and set error state accordingly
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = error.response.data.errors.map(error => error.msg);
        setError(errorMessages.join(', '));
      } else {
        setError(error.response.data.message);
      }
    }
  };
  
  return (
    <div className={styles.postForm}>
      <h1>{isEditing ? 'Edit Post' : 'Create Post'}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          name="content"
          placeholder="Enter your post content"
          value={postData.content}
          onChange={handleChange}
          required
          className={styles.contentInput}
        ></textarea>
        {!isEditing && (
          <div>
            <label htmlFor="pictureUpload" className={styles.fileLabel}>Upload Picture:</label>
            <input type="file" id="pictureUpload" name="picture" onChange={handleFileChange} required accept="image/*" className={styles.fileInput} />
          </div>
        )}
        {isEditing && postData.picture && (
          <div>
            <label htmlFor="pictureUpload" className={styles.fileLabel}>Change Picture:</label>
            <input type="file" id="pictureUpload" name="picture" onChange={handleFileChange} accept="image/*" className={styles.fileInput} />
          </div>
        )}
        {currentPicture && (
          <div className={styles.currentPictureContainer}>
            <p className={styles.currentPictureLabel}>Current Picture:</p>
            <img src={currentPicture} alt="Current Post" className={styles.currentPicture} />
          </div>
        )}
        <button type="submit" className={styles.submitButton}>{isEditing ? 'Update Post' : 'Create Post'}</button>
      </form>
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
  
}

export default PostForm;
