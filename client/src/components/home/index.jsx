import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PostCard from '../postCard/index';
import styles from './style.module.css';

const Home = () => {
  // Check if the user is logged in
  const isLoggedIn = !!localStorage.getItem('token');

  // State variables
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Handle post deletion
  const handlePostDelete = (deletedPostId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== deletedPostId));
  };

  // Fetch posts from the API
  useEffect(() => {
    const fetchPosts = async () => {
      setError(null);
      try {
        const response = await axios.get(`http://localhost:8888/api/posts/load?page=${page}&limit=10`);
        setPosts(prevPosts => [...prevPosts, ...response.data]);
        setLoading(false);
        if (response.data.length === 0) {
          setHasMore(false); // No more posts to load
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError(error);
      }
    };

    if (hasMore) {
      fetchPosts();
    }
  }, [page]); // Fetch posts when page changes

  // Load more posts when scrolling
  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 0.7; // Load new posts when scrolled to 70% of the page height
      const scrolledHeight = window.innerHeight + window.pageYOffset;
      const totalHeight = document.body.scrollHeight;
      if (scrolledHeight >= totalHeight * scrollThreshold) {
        setPage(prevPage => prevPage + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div>
      <div className={styles.postCardContainer}>
      {/* Render each post and its associated actions */}
      {posts.map(post => (
        <React.Fragment key={post._id}>
          <PostCard post={post} onDelete={handlePostDelete}/>
          
        </React.Fragment>
      ))}
      </div>
      {/* Render loading indicator if posts are still loading */}
      {loading && <p>Loading...</p>}
      {/* Render error message if there is an error fetching posts */}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
};

export default Home;
