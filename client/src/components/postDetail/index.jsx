import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Comment from '../comment/index';
import PostCard from '../postCard/index';
import { useNavigate } from 'react-router-dom';
import styles from './style.module.css';

const PostDetail = () => {
  // State variables
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');

  // Router navigation hook
  const navigate = useNavigate();

  // Fetch post and comments data on component mount
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:8888/api/posts/${postId}`);
        setPost(response.data);
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await axios.get(`http://localhost:8888/api/comments/${postId}`);
        setComments(response.data);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchPost();
    fetchComments();
  }, [postId]);

  // Handle form submission for adding new comment
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      // Check if authentication token is available
      if (!token) {
        console.error('No authentication token found.');
        navigate('/login');
        return;
      }

      // Validate comment content length
      if (newComment.length < 3) {
        setError('Content must be at least 3 characters long');
        return;
      }

      setError('');

      // Add new comment to the backend
      const response = await axios.post(
        `http://localhost:8888/api/comments/${postId}`,
        { content: newComment },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Update comments state with the new comment
      setComments([...comments, response.data]);

      // Clear the input field
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      
      // Handle different types of errors and set error state accordingly
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = error.response.data.errors.map(error => error.msg);
        setError(errorMessages.join(', '));
      } else {
        setError(error.response.data.message);
      }
    }
  };

  // Handle comment deletion
  const handleCommentDelete = (commentId) => {
    setComments(comments.filter(comment => comment._id !== commentId));
  };

  return (
    <div className={styles.container}>
      {/* Display post card if post data is available */}
      {post && <PostCard post={post} />}
      
      {/* Form for adding new comment */}
      <form className={styles.commentForm} onSubmit={handleSubmit}>
      <textarea 
        className={styles.commentInput}
        placeholder="Add your comment here..."
        value={newComment} 
        onChange={(e) => setNewComment(e.target.value)} 
      />
      <button className={styles.commentButton} type="submit">Add Comment</button>
    </form>
  
      {/* Display error message if there's an error */}
      {error && <div>{error}</div>}
  
      {/* Display comments */}
      <div className={styles.commentsContainer}>
        <h2>Comments</h2>
        {comments.map(comment => (
          <Comment key={comment._id} comment={comment} onDelete={handleCommentDelete} />
        ))}
      </div>
    </div>
  );
  
};

export default PostDetail;
