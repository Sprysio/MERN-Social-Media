import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate,Link } from 'react-router-dom';
import styles from './style.module.css'; // Import CSS module


const PostCard = ({ post, onDelete }) => {
  // State variables
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [postOwner, setPostOwner] = useState(false);

  // Router navigation hook
  const navigate = useNavigate();

  // Format date function
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

  // Like post function
  const likePost = async () => {
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
      await axios.post(`http://localhost:8888/api/posts/${post._id}/like`, { userId: user._id }, config);
      setLiked(!liked);
      const updatedPostResponse = await axios.get(`http://localhost:8888/api/posts/${post._id}`);
      const updatedPost = updatedPostResponse.data;
      setLikeCount(updatedPost.likes.length);
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      setError(error);
    }
  };

  // Fetch user data function
  const fetchUser = async () => {
    try {
      const response = await axios.get(`http://localhost:8888/api/user/${post.userId}`);
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error);
    }
  };

  // Handle edit post
  const handleEdit = () => {
    if (!postOwner) {
      navigate('/');
    }
    navigate(`/edit-post/${post._id}`, { state: { postData: post } });
  };

  // Handle delete post
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      if (!postOwner) {
        navigate('/');
      }
      const confirmed = window.confirm('Are you sure you want to delete this post?');
      if (!confirmed) {
        return;
      }
      await axios.delete(`http://localhost:8888/api/posts/${post._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      navigate('/');
      onDelete(post._id);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // useEffect hook for fetching user data and setting initial post state
  useEffect(() => {
    fetchUser();
    const token = localStorage.getItem('token');
    if (token) {
      const user = JSON.parse(atob(token.split('.')[1]));
      const isPostOwner = post.userId === user._id;
      const userLikedPost = post.likes.some(like => like._id === user._id);
      setPostOwner(isPostOwner);
      setLiked(userLikedPost);
    }
    setLikeCount(post.likes.length);
  }, [post.userId, post.likes]);

  return (
    <div className={styles['post-card']}>
      {loading && <p>Loading user data...</p>}
      {error && <p>Error fetching user data: {error.message}</p>}
      {user && (
        <div className={styles['user-info']}>
          <Link to={`/user/${user._id}`} className={styles['username-link']}>
            {user.profile_picture && (
              <img
                src={`http://localhost:8888/profile_pictures/${user.profile_picture}`}
                alt="User"
                className={styles['profile-picture']}
              />
            )}
            <strong className={styles['username']}>{user.username}</strong>
            
          </Link>
          <small className={styles['updated-at']}>Updated at: {formatDate(post.createdAt)}</small>
        </div>
      )}
      <div className={styles['post-content']}>
        
        <p>{post.content}</p>
        {post.picture && <img src={`http://localhost:8888/post_pictures/${post.picture}`} alt="Post" className={styles['post-image']} />}
        <div className={styles['post-footer']}>
          <p>Likes: {likeCount}</p>
          <button onClick={likePost} className={styles['like-button']}>{liked ? 'Unlike' : 'Like'}</button>
          <Link to={`/posts/${post._id}`}>
            <button className={styles['comment-button']}>Comments</button>
          </Link>
          {postOwner && (
            <div className={styles['edit-delete-buttons']}>
              <button onClick={handleEdit} className={styles['edit-button']}>Edit</button>
              <button onClick={handleDelete} className={styles['delete-button']}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
