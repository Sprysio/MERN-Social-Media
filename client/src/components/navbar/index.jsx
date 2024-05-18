import React from 'react';
import { Link } from 'react-router-dom';
import styles from './style.module.css';

function NavBar() {
  // Retrieve token from local storage
  const token = localStorage.getItem('token');
  let userId;

  // Extract user ID from token if user is logged in
  if (token) {
    userId = JSON.parse(atob(token.split('.')[1]))._id;
  }

  // Check if user is logged in
  const isLoggedIn = !!token;

  // Handle logout action
  const handleLogout = () => {
    localStorage.removeItem('token');
    // Redirect to home page after logout
    window.location.href = '/';
  };

  return (
    <nav className={styles.navbar}> {/* Use CSS class from module */}
      
      {isLoggedIn ? (
          <>
            {/* Render "Create Post" button if the user is logged in */}
            <Link to="/create-post" className={styles.createPostButton}>Create Post</Link>
            </>
        ) : (
          <>
            {/* Render "Login" button if the user is not logged in */}
            <Link to="/login" className={styles.createPostButton}>Create Post</Link>
            </>
        )}
        <div className={styles['navbar-links']}>
        {/* Home link */}
        <Link to="/" className={styles.link}>Home</Link>
        {/* Conditional rendering based on user authentication */}
        {isLoggedIn ? (
          <>
            {/* Profile link */}
            <Link to={`/user/${userId}`} className={styles.link}>Profile</Link>
            {/* Settings link */}
            <Link to="/settings" className={styles.link}>Settings</Link>
            {/* Logout button */}
            <button onClick={handleLogout} className={`${styles.link} ${styles.logoutButton}`}>Logout</button>
          </>
        ) : (
          <>
            {/* Login link */}
            <Link to="/login" className={styles.link}>Login</Link>
            {/* Register link */}
            <Link to="/register" className={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
