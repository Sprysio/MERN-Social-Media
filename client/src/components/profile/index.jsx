import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import PostCard from '../postCard/index';
import styles from './style.module.css';

const Profile = () => {
  // State variables
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // Default sorting by newest

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:8888/api/user/${userId}`);
        setUserData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error);
      }
    };
    fetchUserData();
  }, [userId]);

  // Fetch user posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const response = await axios.get(`http://localhost:8888/api/posts/user/${userId}?page=${page}&limit=10&sort=${sortBy}`);
        setPosts(prevPosts => [...prevPosts, ...response.data]);
        setLoading(false);
        if (response.data.length === 0) {
          setHasMore(false); // No more posts to load
        }
      } catch (error) {
        console.error('Error fetching user posts:', error);
        setError(error);
      }
    };

    if (hasMore) {
      fetchUserPosts();
    }
  }, [userId, page, sortBy, hasMore]); // Fetch user posts when page, userId, sortBy, or hasMore changes

  // Infinite scroll pagination
  const handleScroll = () => {
    const scrollThreshold = 0.7; // Load new posts when scrolled to 70% of the page height
    const scrolledHeight = window.innerHeight + window.pageYOffset;
    const totalHeight = document.body.scrollHeight;
    if (scrolledHeight >= totalHeight * scrollThreshold) {
      setPage(prevPage => prevPage + 1);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle sorting change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPosts([]); // Clear posts when changing sorting to fetch new sorted posts
    setPage(1); // Reset page to 1 when changing sorting
    setHasMore(true); // Reset hasMore to true when changing sorting
  };

  return (
    <div className={styles.profilePage}>
      {loading && <p>Loading user data...</p>}
      {error && <p>Error fetching user data: {error.message}</p>}
      {userData && (
        <div className={styles.userData}>
          {userData.profile_picture && <img src={`http://localhost:8888/profile_pictures/${userData.profile_picture}`} alt="Profile" className={styles.profilePicture} />}
          <h2>Username: {userData.username}</h2>
          {userData.dateOfBirth && <h2>Date of Birth: {new Date(userData.dateOfBirth).toLocaleDateString()}</h2>}
          {userData.gender && <h2>Gender: {userData.gender}</h2>}
          </div>
      )}
      <div className={styles.sortBy}>
        <label>Sort By:</label>
        <select value={sortBy} onChange={handleSortChange}>
          <option value="newest">Newest</option>
          <option value="likeCount">Most Liked</option>
        </select>
      </div>
      <div className={styles.posts}>
        {posts.map(post => (
          <PostCard key={post._id} post={post} />
        ))}
        {loading && <p>Loading more posts...</p>}
        {error && <p>Error fetching more posts: {error.message}</p>}
      </div>
    </div>
  );
  
};

export default Profile;
