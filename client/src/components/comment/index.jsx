import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate,Link } from 'react-router-dom';
import styles from './style.module.css';

const Comment = ({ comment, onDelete }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const navigate = useNavigate();
  const [commentOwner, setCommentOwner] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [actualComment, setActualComment] = useState(comment.content);

  // Fetch user data for the comment author
  const fetchUser = async () => {
    try {
      const response = await axios.get(`http://localhost:8888/api/user/${comment.userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.response.data.message);
    }
  };

  // Format the creation date of the comment
  const formatDate = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = Math.abs(now - created);

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} min ago`;
    } else if (hours < 24) {
      return `${hours} hr ago`;
    } else {
      const options = { month: 'short', day: 'numeric' };
      return created.toLocaleDateString('en-US', options);
    }
  };

  // Like or unlike the comment
  const likeComment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const user = JSON.parse(atob(token.split('.')[1]));
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await axios.post(`http://localhost:8888/api/comments/${comment._id}/like`, {
        userId: user._id
      }, config);

      setLiked(!liked);
      const updatedCommentResponse = await axios.get(`http://localhost:8888/api/comments/comment/${comment._id}`);
      const updatedComment = updatedCommentResponse.data;
      
      // Update the like count based on the updated comment data
      setLikeCount(updatedComment.likes.length);
    } catch (error) {
      console.error('Error liking/unliking comment:', error);
      setError(error.response.data.message);
    }
  };
  
  // Handle the deletion of the comment
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found.');
        navigate('/login');
        return;
      }
      if (!commentOwner) {
        return;
      }
      const confirmed = window.confirm('Are you sure you want to delete this comment?');
      if (!confirmed) {
        return;
      }
      await axios.delete(`http://localhost:8888/api/comments/${comment._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onDelete(comment._id); 
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error.response.data.message);
    }
  };

  // Toggle edit mode for the comment
  const handleEditToggle = () => {
    setEditMode(!editMode);
    setEditedContent(actualComment);
  };

  // Handle changes to the edited content of the comment
  const handleContentChange = (e) => {
    setEditedContent(e.target.value);
  };

  // Submit the edited comment content
  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found.');
        navigate('/login');
        return;
      }
      if (!commentOwner) {
        navigate('/');
      }
      if (editedContent.length < 3) {
        setError('Content must be at least 3 characters long');
        return;
      }
      setError('');
      const response = await axios.post(
        `http://localhost:8888/api/comments/${comment._id}/edit`, // Use the endpoint with /edit
        { content: editedContent }, // Include the updated content in the request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the comment content in the UI
      setActualComment(response.data.content);
      setEditMode(false);
    } catch (error) {
      console.error('Error editing comment:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        // If the error response contains errors array, handle them
        const errorMessages = error.response.data.errors.map(error => error.msg);
        setError(errorMessages.join(', '));
      } else {
        setError(error.response.data.message);
      }
    }
  };

  useEffect(() => {
    fetchUser();
    const token = localStorage.getItem('token');

    if (token) {
      const user = JSON.parse(atob(token.split('.')[1]));
      // Check if the user liked the comment
      const userLikedComment = comment.likes.includes(user._id);
      const isCommentOwner = comment.userId === user._id;
      setCommentOwner(isCommentOwner);
      // Update state based on whether the user liked the comment
      setLiked(userLikedComment);
    }
    setLikeCount(comment.likes.length);
  }, [comment.userId, comment.likes]);

  return (
    <div className={styles.comment}>
      {user && (
        <div className={styles.userInfo}>
          <Link to={`/user/${user._id}`} className={styles.usernameLink}>
            {user.profile_picture && (
              <img
                src={`http://localhost:8888/profile_pictures/${user.profile_picture}`}
                alt="User"
                className={styles.profilePicture}
              />
            )}
            <strong className={styles.username}>{user.username}</strong>
          </Link>
          <small className={styles.updatedAt}>Posted: {formatDate(comment.createdAt)}</small>
        </div>
      )}
      
      {editMode ? (
        <textarea className={styles.commentTextarea} value={editedContent} onChange={handleContentChange} />
      ) : (
        <p>{actualComment}</p>
      )}
  <div className={styles.commentFooter}>
      <p>Likes: {likeCount}</p>
      <button onClick={likeComment} className={styles.commentButton}>{liked ? 'Unlike' : 'Like'}</button>
      {commentOwner && (
        <div className={styles.editDeleteButtons}>
          <button onClick={handleEditToggle} className={styles.commentEditButton}>{editMode ? 'Cancel' : 'Edit'}</button>
          {editMode && <button onClick={handleEditSubmit} className={styles.commentEditButton}>Save</button>}
          <button onClick={handleDelete} className={styles.commentDeleteButton}>Delete</button>
        </div>
      )}
      </div>
      {error && <div>{error}</div>}
    </div>
  );
  
};

export default Comment;
